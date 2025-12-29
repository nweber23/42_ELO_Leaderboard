import './spinner.css';

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
};

export const Spinner = ({ size = 'md' }: SpinnerProps) => {
  return (
    <div className={`spinner-container spinner-container--${size}`}>
      <div className={`spinner spinner--${size}`} />
    </div>
  );
};
