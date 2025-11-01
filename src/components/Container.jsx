import "./Container.css";

function Container({ children, className = "" }) {
  return <div className={`container-wrapper ${className}`}>{children}</div>;
}

export default Container;
