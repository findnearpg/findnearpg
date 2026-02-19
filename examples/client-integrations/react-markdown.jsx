import * as MarkdownRenderer from "@/client-integrations/react-markdown";
import React from "react";

function MainComponent() {
	const [markdown, setMarkdown] = React.useState(`# Hello, Markdown World!

## Welcome to my Markdown renderer

This is a **demonstration** of the *MarkdownRenderer* component.

### Features:
- Renders markdown text
- Supports **bold** and *italic* formatting
- Handles [links](https://create.xyz)
- Displays lists and more

> This is a blockquote that shows how quotes appear in the rendered output.

#### Code example:
\`\`\`javascript
function example() {
  console.log("Hello, Markdown!");
}
\`\`\`
`);

	const [editorVisible, setEditorVisible] = React.useState(false);

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 p-4">
			<div className="max-w-4xl mx-auto">
				<div className="bg-white rounded-lg shadow-lg p-6 mb-4">
					<div className="flex justify-between items-center mb-4">
						<h1 className="text-2xl font-bold text-blue-600 font-roboto">
							Markdown Renderer
						</h1>
						<button
							type="button"
							onClick={() => setEditorVisible(!editorVisible)}
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
						>
							{editorVisible ? "Hide Editor" : "Edit Markdown"}
						</button>
					</div>

					{editorVisible && (
						<div className="mb-4">
							<textarea
								value={markdown}
								onChange={(e) => setMarkdown(e.target.value)}
								className="w-full h-64 p-2 border border-gray-300 rounded font-mono text-sm"
							/>
						</div>
					)}

					<div
						className={`markdown-display p-4 border ${editorVisible ? "border-blue-200 bg-blue-50" : ""} rounded`}
					>
						<MarkdownRenderer.Display>{markdown}</MarkdownRenderer.Display>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-lg p-6">
					<h2 className="text-xl font-bold text-gray-700 mb-2 font-roboto">
						About This App
					</h2>
					<p className="text-gray-600">
						This app demonstrates how to use the MarkdownRenderer component to
						display formatted markdown content. You can edit the markdown in the
						text area above and see the rendered output in real-time.
					</p>
				</div>
			</div>
		</div>
	);
}

export default MainComponent;
