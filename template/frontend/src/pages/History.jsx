import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router'
import TransactionList from '../components/TransactionList.jsx'
import Pagination from '../components/Pagination.jsx'

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState(null)

  const page = parseInt(searchParams.get('page')) || 1
  const limit = parseInt(searchParams.get('limit')) || 10

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`/api/transactions?page=${page}&limit=${limit}`)
      const json = await res.json()
      setData(json.data)
      setPagination(json.pagination)
    } catch (err) {
      console.error('Erro ao buscar transacoes:', err)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [page, limit])

  const goToPage = (newPage) => {
    setSearchParams({ page: newPage.toString(), limit: limit.toString() })
  }

  const handleRefund = async (id) => {
    try {
      const res = await fetch(`/api/transactions/${id}/refund`, { method: 'POST' })
      if (res.ok) {
        fetchTransactions()
      }
    } catch (err) {
      console.error('Erro ao estornar:', err)
    }
  }

  return (
    <div>
      <h1>Historico de Transacoes</h1>

      <TransactionList data={data} onRefund={handleRefund} />

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.total_pages}
          total={pagination.total}
          onPrev={() => goToPage(page - 1)}
          onNext={() => goToPage(page + 1)}
        />
      )}
    </div>
  )
}
