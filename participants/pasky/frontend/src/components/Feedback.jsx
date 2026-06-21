import '../styles/Feedback.css'

export default function Feedback({ feedback }) {
  const className = feedback.type === 'success' ? 'feedback-success' : 'feedback-error'
  
  return (
    <div className={className}>
      <p>{feedback.message}</p>
    </div>
  )
}