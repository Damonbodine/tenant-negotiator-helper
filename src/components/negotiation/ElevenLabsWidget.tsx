
import { useEffect, useRef } from "react";

export const ElevenLabsWidget = () => {
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Load widget script if not already present
    if (!document.querySelector('script[src="https://elevenlabs.io/convai-widget/index.js"]')) {
      const script = document.createElement('script');
      script.src = "https://elevenlabs.io/convai-widget/index.js";
      script.async = true;
      script.type = "text/javascript";
      document.body.appendChild(script);
    }

    // Remove any previously injected custom styles
    const existingStyle = document.querySelector('style[data-elevenlabs-widget]');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Add custom styles to position the widget inside our container
    const style = document.createElement('style');
    style.setAttribute('data-elevenlabs-widget', 'true');
    style.textContent = `
      elevenlabs-convai {
        position: relative !important;
        bottom: auto !important;
        left: auto !important;
        right: auto !important;
        z-index: 1 !important;
        display: block !important;
        width: 100% !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.querySelector('style[data-elevenlabs-widget]')) {
        document.querySelector('style[data-elevenlabs-widget]')?.remove();
      }
    };
  }, []);

  return (
    <div ref={widgetContainerRef} className="elevenlabs-widget-container min-h-[400px] flex justify-center">
      <elevenlabs-convai agent-id="VT5HhuEwB5po9ZHZGcOk"></elevenlabs-convai>
    </div>
  );
};
