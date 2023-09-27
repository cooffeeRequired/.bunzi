import hljs from 'highlight.js';

export class BunziiError extends Response {
    constructor(message: string, status: number) {
        super(message, { status, headers: { "Content-Type": "text/html" } });
    }

    static async throw(message: string, stack: any, status: number) {
        const trace = hljs.highlight(stack, { language: 'php' }).value;

        const text = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/default.min.css">
            <title>Bunzii</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                }

                .error-container {
                    text-align: center;
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 5px;
                    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
                }

                .error-icon {
                    font-size: 48px;
                    color: #e74c3c;
                    margin-bottom: 10px;
                }

                .error-message {
                    font-size: 24px;
                    color: #333;
                    margin-bottom: 20px;
                }

                .error-description {
                    font-size: 16px;
                    color: #777;
                }

                .stack-trace {
                    font-size: 14px;
                    text-align: left;
                    background-color: #f9f9f9;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    margin-top: 10px;
                    white-space: pre-wrap;
                    display: none;
                }

                .error-action {
                    margin-top: 20px;
                }

                .error-action a {
                    text-decoration: none;
                    color: #3498db;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="error-container">
                <div class="error-icon">❌</div>
                <div class="error-message">Error (${status})</div>
                <div class="error-description">An error occurred while processing the request.</div>
                <div class="error-description">${message}</div>
                <div class="error-action">
                    <a href="#" id="show-stack-trace">Show Stack Trace</a>
                    <div class="stack-trace" id="stack-trace">${trace}</div>
                </div>
            </div>
            <script>
                const showStackTraceLink = document.getElementById("show-stack-trace");
                const stackTraceCode = document.getElementById("stack-trace");
                showStackTraceLink.addEventListener("click", function() {
                    if (stackTraceCode.style.display === "block") {
                        stackTraceCode.style.display = "none";
                        showStackTraceLink.innerHTML = "Show Stack Trace";
                    } else {
                        stackTraceCode.style.display = "block";
                        showStackTraceLink.innerHTML = "Hide Stack Trace";
                    }
                });
            </script>
        </body>
        </html>
        `
        return new BunziiError(text, status);
    }
}
