import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_THUMB_HEIGHT = 48;
const HIDE_DELAY_MS = 1000;

/**
 * Custom overlay scrollbar for the page. The native root scrollbar is hidden
 * in index.css (it would reserve layout space and repaint the background when
 * appearing); this floats a draggable thumb above the content instead, fading
 * out when idle like a macOS overlay scrollbar. Wheel / keyboard / touch
 * scrolling is untouched — this only re-adds the visual indicator and the
 * mouse drag affordance the hidden native bar took away.
 */
const OverlayScrollbar = () => {
  const [thumb, setThumb] = useState(null); // { top, height } | null when no overflow
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef(null);
  const dragRef = useRef(null); // { startY, startScrollTop } | null
  const hoverRef = useRef(false);

  const measure = useCallback(() => {
    const { scrollHeight, clientHeight } = document.documentElement;
    if (scrollHeight <= clientHeight + 1) {
      setThumb(null);
      return;
    }
    const height = Math.max((clientHeight / scrollHeight) * clientHeight, MIN_THUMB_HEIGHT);
    const maxTop = clientHeight - height;
    const top = (window.scrollY / (scrollHeight - clientHeight)) * maxTop;
    setThumb({ top, height });
  }, []);

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!dragRef.current && !hoverRef.current) setVisible(false);
    }, HIDE_DELAY_MS);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      measure();
      setVisible(true);
      scheduleHide();
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    // Re-measure when page content grows/shrinks (skins added, parts picked).
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      observer.disconnect();
      clearTimeout(hideTimer.current);
    };
  }, [measure, scheduleHide]);

  const onPointerDown = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startY: event.clientY, startScrollTop: window.scrollY };
    setVisible(true);
  };

  const onPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || !thumb) return;
    const { scrollHeight, clientHeight } = document.documentElement;
    const maxTop = clientHeight - thumb.height;
    if (maxTop <= 0) return;
    const dy = event.clientY - drag.startY;
    window.scrollTo({
      top: drag.startScrollTop + (dy / maxTop) * (scrollHeight - clientHeight),
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
    scheduleHide();
  };

  const onPointerEnter = () => {
    hoverRef.current = true;
    setVisible(true);
    clearTimeout(hideTimer.current);
  };

  const onPointerLeave = () => {
    hoverRef.current = false;
    scheduleHide();
  };

  if (!thumb) return null;

  return (
    <div
      aria-hidden="true"
      data-testid="overlay-scrollbar"
      className={`fixed right-0.5 top-0 z-40 w-2.5 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ height: '100%', pointerEvents: 'none' }}
    >
      <div
        className="w-full cursor-default rounded-full bg-black/50 hover:bg-black/70"
        style={{
          transform: `translateY(${thumb.top}px)`,
          height: thumb.height,
          pointerEvents: visible ? 'auto' : 'none',
          touchAction: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      />
    </div>
  );
};

export default OverlayScrollbar;
