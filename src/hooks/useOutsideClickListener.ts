import { useEffect } from 'react';

const useOutsideClickListener = (targetRefs: React.RefObject<Node | null>[], callback: () => void) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node) {
        const isOutsideClick = targetRefs.every(
          (targetRef: React.RefObject<Node | null>) =>
            targetRef.current === null || !targetRef.current.contains(target),
        );
        if (isOutsideClick) {
          callback();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [targetRefs, callback]);
};

export default useOutsideClickListener;
