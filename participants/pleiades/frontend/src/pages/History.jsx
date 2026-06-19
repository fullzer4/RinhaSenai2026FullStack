import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams()

  // TODO: estado para lista de transacoes e paginacao
  // TODO: ler page e limit dos query params (useSearchParams)
  // TODO: buscar transacoes da API (GET /api/transactions?page=X&limit=Y)
  // TODO: implementar navegacao entre paginas (atualizar query params)
  // TODO: implementar estorno (POST /api/transactions/:id/refund)

  return (
    <div>
      <h1>Historico de Transacoes</h1>

      {/* TODO: lista de transacoes (.list-transactions, .transaction-item) */}
      {/* TODO: paginacao (.pagination-current, .btn-prev-page, .btn-next-page) */}
    </div>
  )
}
