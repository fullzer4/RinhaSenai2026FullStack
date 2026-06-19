import { useState, useEffect } from 'react'
import { useParams } from 'react-router'

export default function Detail() {
  const { id } = useParams()

  // TODO: estado para a transacao
  // TODO: buscar transacao da API (GET /api/transactions/:id)
  // TODO: implementar estorno (POST /api/transactions/:id/refund)

  return (
    <div>
      <h1>Detalhe da Transacao</h1>

      {/* TODO: exibir todos os campos da transacao (.detail-*) */}
      {/* TODO: botao de estorno (.btn-refund) se status = approved */}
    </div>
  )
}
