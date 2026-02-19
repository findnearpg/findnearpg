import { serializeError } from 'serialize-error';

export const getHTMLForErrorPage = (err: unknown): string => {
  return `
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; }
    </style>
    <script>
    function showCopyToast () {
      const existing = document.getElementById('copy-toast');
      if (existing) {
        existing.remove();
      }
      const toast = document.createElement('div');
      toast.id = 'copy-toast';
      toast.innerHTML = \`
        <div class="flex items-center gap-2 whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
            <title>Success</title>
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
          </svg>
          <span class="text-sm">Copied successfully!</span>
        </div>
      \`;
      toast.className = "fixed top-6 left-1/2 -translate-x-1/2 -translate-y-4 opacity-0 text-white bg-[#18191B] border border-[#2C2D2F] rounded-2xl px-6 py-3 text-sm shadow-2xl transition-all duration-300 ease-out pointer-events-none max-w-none w-auto whitespace-nowrap";
      document.body.appendChild(toast);
      requestAnimationFrame(() => {
        toast.classList.remove("-translate-y-4", "opacity-0");
        toast.classList.add("opacity-100", "translate-y-0");
      });
      setTimeout(() => {
        toast.classList.add("-translate-y-2", "opacity-0");
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
    function sendFixMessage() {
      window.parent.postMessage({ type: 'sandbox:web:fix', error: ${JSON.stringify(serializeError(err))} }, '*');
    }
    function sendLogsMessage() {
      window.parent.postMessage({ type: 'sandbox:web:show-logs' }, '*');
    }
    function copyError () {
      navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(serializeError(err))}, null, 2))
      showCopyToast()
    }
    window.onload = () => {
      window.parent.postMessage({ type: 'sandbox:web:ready' }, '*');
      window.parent.postMessage({ type: 'sandbox:web:ssr-error', error: ${JSON.stringify(serializeError(err))} }, '*');
      const [fix, logs, copy] = [document.getElementById('fix'), document.getElementById('logs'), document.getElementById('copy')];
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        // show all the buttons
        [fix, copy, logs].forEach(button => {
          button.classList.remove('opacity-0');
          button.classList.add('opacity-100');
        });
      } else {
        // show only copy button
        [copy].forEach(button => {
          button.classList.remove('opacity-0');
          button.classList.add('opacity-100');
        });
        [fix, logs].forEach(button => {
          button.classList.add('hidden');
        });
      }
      const healthyResponseType = 'sandbox:web:healthcheck:response';
      const healthyResponse = {
        type: healthyResponseType,
        healthy: true,
        hasError: true,
      };
      const handleMessage = (event) => {
        if (event.data.type === 'sandbox:navigation') {
          window.location.pathname = event.data.pathname;
        }
        if (event.data.type === 'sandbox:web:healthcheck') {
          window.parent.postMessage(healthyResponse, '*');
        }
      };
      window.addEventListener('message', handleMessage);
      console.error(${JSON.stringify(serializeError(err))});
    }
    </script>
  </head>
  <body class="min-h-screen">
    <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out opacity-100 w-full max-w-lg px-4">
      <div class="bg-[#18191B] text-[#F2F2F2] rounded-lg px-4 py-4 w-full shadow-lg">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 mx-1 bg-[#F2F2F2] rounded-full flex items-center justify-center">
              <span class="text-black text-lg leading-none">⚠</span>
            </div>
          </div>
          <div class="flex flex-col gap-2 flex-1">
            <div class="flex flex-col gap-1">
              <p class="font-light text-[#F2F2F2] text-sm">App Error Detected</p>
              <p class="text-[#959697] text-sm font-light">It looks like an error occurred while trying to use your app.</p>
            </div>
            <div class="flex gap-2">
              <button id="fix" onclick="sendFixMessage()" class="flex flex-row items-center justify-center gap-1 outline-none transition-all opacity-0 rounded-lg border bg-[#f9f9f9] hover:bg-[#dbdbdb] active:bg-[#c4c4c4] border-[#c4c4c4] text-[#18191B] text-sm px-2 py-1 cursor-pointer" type="button" tabindex="0">Try to fix</button>
              <button id="logs" onclick="sendLogsMessage()" class="flex flex-row items-center justify-center gap-1 outline-none transition-all opacity-0 rounded-lg border bg-[#2C2D2F] hover:bg-[#414243] active:bg-[#555658] border-[#414243] text-white text-sm px-2 py-1 cursor-pointer" type="button" tabindex="0">Show logs</button>
              <button id="copy" onclick="copyError()" class="flex flex-row items-center justify-center gap-1 outline-none transition-all opacity-0 rounded-lg border bg-[#2C2D2F] hover:bg-[#414243] active:bg-[#555658] border-[#414243] text-white text-sm px-2 py-1 cursor-pointer">Copy error</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
    `;
};
