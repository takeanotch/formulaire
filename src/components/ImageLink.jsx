// components/ImageLink.jsx
import Image from 'next/image';
import Link from 'next/link';

const ImageLink = ({ 
  src, 
  alt, 
  href, 
  width = 300, 
  height = 200, 
  className = '',
  target = '_blank',
  ...props 
}) => {
  return (
    <Link href={href} target={target} className={`inline-block ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        style={{ cursor: 'pointer' }}
        {...props}
      />
    </Link>
  );
};

export default ImageLink;