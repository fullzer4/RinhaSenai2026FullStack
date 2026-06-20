// Mutex simples e extremamente leve para serializar escritas criticas
// (criacao de transacao + checagem de limite diario + refund) dentro do
// mesmo processo Node.
//
// Por que isso e necessario mesmo com WAL + busy_timeout?
// SQLite permite apenas 1 writer ativo por vez. Se 200 requests chegarem
// concorrentes e cada uma abrir sua propria transacao de escrita, o SQLite
// vai serializar no nivel do arquivo de qualquer forma -- mas isso gera:
//   - retries custosos (SQLITE_BUSY) cada um pagando o busy_timeout
//   - janelas onde duas conexoes leem o mesmo "saldo do dia" antes de
//     qualquer uma escrever, permitindo ultrapassar o limite diario
//     (classic check-then-act race condition)
//
// Serializando no nivel da aplicacao (fila JS, sem custo de syscall/locks
// do SO) nos da:
//   - zero SQLITE_BUSY em escrita (so 1 transacao de escrita ativa por vez)
//   - check-then-act atomico por construcao (a fila garante que ninguem
//     mais entra entre o SELECT do limite e o INSERT)
//   - leituras (GET) continuam livres e paralelas via WAL, nao passam pela fila
//
// O custo e minimo: cada tarefa na fila e uma operacao SQLite local
// (sub-milissegundo), entao o throughput permanece alto mesmo serializado.
class Mutex {
  #tail = Promise.resolve()

  /**
   * Executa `fn` com exclusividade: nenhuma outra chamada a `run`
   * comeca a executar antes desta terminar (resolver ou rejeitar).
   */
  run(fn) {
    const result = this.#tail.then(() => fn())
    // Garante que o proximo da fila roda mesmo se este rejeitar,
    // e nao deixa o `#tail` "preso" em rejected (catch interno).
    this.#tail = result.then(() => undefined, () => undefined)
    return result
  }
}

export const writeMutex = new Mutex()
