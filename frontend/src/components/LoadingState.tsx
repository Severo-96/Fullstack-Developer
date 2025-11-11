interface LoadingStateProps {
  message?: string;
}

const LoadingState = ({ message = 'Loading...' }: LoadingStateProps) => (
  <div className="d-flex justify-content-center align-items-center py-5">
    <div className="text-center">
      <div className="spinner-border text-primary mb-3" role="status" />
      <p className="text-muted mb-0">{message}</p>
    </div>
  </div>
);

export default LoadingState;

