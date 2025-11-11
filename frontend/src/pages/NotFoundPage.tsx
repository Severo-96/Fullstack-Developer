import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="text-center py-5">
    <h1 className="display-4 fw-bold">404</h1>
    <p className="lead">The page you’re looking for can’t be found.</p>
    <p className="text-muted">
      Let’s get you back to something more interesting.
    </p>
    <Link to="/" className="btn btn-primary">
      Go to dashboard
    </Link>
  </div>
);

export default NotFoundPage;

