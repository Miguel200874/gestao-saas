import { CheckCircle, XCircle, Info } from 'lucide-react'

export function ToastContainer({ toasts }) {
  if (!toasts.length) return null

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' && <CheckCircle size={15} />}
          {t.type === 'error' && <XCircle size={15} />}
          {t.type === 'default' && <Info size={15} />}
          {t.message}
        </div>
      ))}
    </div>
  )
}
