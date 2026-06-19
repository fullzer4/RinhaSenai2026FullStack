import { useState, useEffect } from 'react'

export default function Dashboard() {
  // TODO: estado para feedback (sucesso/erro apos submit)
  // TODO: estado para dados do saldo

  // TODO: buscar saldo da API (GET /api/balance)

  // TODO: enviar pagamento para API (POST /api/transactions)
  // - montar o body com os dados do formulario
  // - tratar resposta: approved, declined, erro 422
  // - atualizar saldo apos cada transacao

  return (
    <div>
      <h1>Gateway de Pagamento</h1>

      {/* TODO: formulario de pagamento */}
      {/* TODO: feedback de sucesso (.feedback-success) ou erro (.feedback-error) */}
      {/* TODO: resumo do saldo */}
    </div>
  )
}
