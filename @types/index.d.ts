type Nullable<T> = T | null;

type NonNullableObj<T> = {
  [K in keyof T]-?: T[K];
};

type DataMap<T> = {
  data: T;
};

interface IParentComponentProps {
  className?: string;
  children: ReactChild;
}

declare module 'shortid';

declare module '*.svg' {
  import React from 'react';
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: React.FC<React.SVGProps<SVGSVGElement>>;
  export default src;
}
