
import { useEffect, useRef } from "react";

export const ElevenLabsWidget = () => {
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Add custom styles to head
    const style = document.createElement('style');
    style.textContent = `
      elevenlabs-convai {
        position: fixed !important;
        bottom: 20px !important;
        left: 20px !important;
        right: auto !important;
        z-index: 9999 !important;
      }
    `;
    document.head.appendChild(style);

    // Load widget script if not already present
    if (!document.querySelector('script[src="https://elevenlabs.io/convai-widget/index.js"]')) {
      const script = document.createElement('script');
      script.src = "https://elevenlabs.io/convai-widget/index.js";
      script.async = true;
      script.type = "text/javascript";
      document.body.appendChild(script);
    }

    // Add load event listener for additional positioning
    window.addEventListener('load', function positionWidget() {
      const widget = document.querySelector('elevenlabs-convai') as HTMLElement;
      if (widget) {
        widget.style.position = 'fixed';
        widget.style.bottom = '20px';
        widget.style.left = '20px';
        widget.style.right = 'auto';
        widget.style.zIndex = '9999';
      }
      window.removeEventListener('load', positionWidget);
    });

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div ref={widgetContainerRef} className="elevenlabs-widget-container min-h-[400px]">
      <elevenlabs-convai agent-id="VT5HhuEwB5po9ZHZGcOk"></elevenlabs-convai>
    </div>
  );
};
