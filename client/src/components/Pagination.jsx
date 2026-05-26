import { useMemo } from 'react'

export default function Pagination({ currentPage, totalItems, itemsPerPage = 30, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    
    const pages = []
    
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    }
    
    return pages
  }, [currentPage, totalPages])

  if (totalPages <= 1) return null

  return (
    <div className="pagination">
      <span className="pagination-info">
        第 {currentPage} 頁 / 共 {totalPages} 頁
        <span className="pagination-total">（共 {totalItems} 筆資料）</span>
      </span>
      
      <div className="pagination-controls">
        <button 
          onClick={() => onPageChange(1)} 
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          首页
        </button>
        <button 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          上一頁
        </button>
        
        {pageNumbers.map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
            >
              {page}
            </button>
          )
        ))}
        
        <button 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          下一頁
        </button>
        <button 
          onClick={() => onPageChange(totalPages)} 
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          末頁
        </button>
      </div>
    </div>
  )
}