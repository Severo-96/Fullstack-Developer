import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="text-center py-5">
    <h1 className="display-4 fw-bold">404</h1>
    <p className="lead">Não encontramos a página que você procura.</p>
    <p className="text-muted">
      Vamos levá-lo de volta a algo mais interessante.
    </p>
    <Link to="/" className="btn btn-primary">
      Ir para o painel
    </Link>
  </div>
);

export default NotFoundPage;

