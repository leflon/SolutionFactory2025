// Example component, delete later.

interface TitleProps {
  /**
   * The content of the title.
   */
  children: React.ReactNode;
  /**
   * Optional CSS class names to apply to the heading.
   */
  className?: string;
};

const Title: React.FC<TitleProps> = ({ children, className }) => {
  return (
	<h1
		className={className}
		style={{color: 'red'}}
	>
		{children}
	</h1>
  )
};

export default Title;
