import * as PDFParser from "@/client-integrations/pdfjs";
import React from "react";

function MainComponent() {
	const [file, setFile] = React.useState(null);
	const [fileName, setFileName] = React.useState("");
	const [extractedText, setExtractedText] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);
	const [error, setError] = React.useState(null);
	const fileInputRef = React.useRef(null);

	const handleFileChange = (event) => {
		if (event.target.files?.[0]) {
			const selectedFile = event.target.files[0];
			setFile(selectedFile);
			setFileName(selectedFile.name);
			setExtractedText("");
			setError(null);
		}
	};

	const handleDragOver = (event) => {
		event.preventDefault();
	};

	const handleDrop = (event) => {
		event.preventDefault();
		if (event.dataTransfer.files?.[0]) {
			const droppedFile = event.dataTransfer.files[0];
			setFile(droppedFile);
			setFileName(droppedFile.name);
			setExtractedText("");
			setError(null);
		}
	};

	const handleSamplePDF = async () => {
		try {
			setIsLoading(true);
			setError(null);

			// Create a simple sample PDF with text content
			const pdfBlob = new Blob(
				[
					"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>>/Parent 2 0 R>>endobj 4 0 obj<</Length 90>>stream\nBT\n/F1 24 Tf\n100 700 Td\n(Hello, this is a sample PDF file.) Tj\n0 -50 Td\n(Created for PDF text extraction testing.) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\n0000000251 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n391\n%%EOF",
				],
				{ type: "application/pdf" },
			);

			const sampleFile = new File([pdfBlob], "sample.pdf", {
				type: "application/pdf",
			});
			setFile(sampleFile);
			setFileName("sample.pdf");
			setExtractedText("");

			await extractText(sampleFile);
		} catch (err) {
			console.error(err);
			setError(`Failed to load sample PDF: ${err.message}`);
		} finally {
			setIsLoading(false);
		}
	};

	const extractText = async (pdfFile) => {
		try {
			setIsLoading(true);
			setError(null);

			const text = await PDFParser.extractTextFromPDF(pdfFile);

			if (text) {
				setExtractedText(text);
			} else {
				setError("No text could be extracted from the PDF.");
			}
		} catch (err) {
			console.error(err);
			setError(`Error extracting text: ${err.message}`);
		} finally {
			setIsLoading(false);
		}
	};

	const handleExtract = async () => {
		if (!file) {
			setError("Please upload a PDF file first.");
			return;
		}

		await extractText(file);
	};

	const handleClearAll = () => {
		setFile(null);
		setFileName("");
		setExtractedText("");
		setError(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 p-6">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">
					PDF Text Extractor
				</h1>

				<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
					<h2 className="text-xl font-semibold text-gray-700 mb-4">
						Upload PDF
					</h2>

					<div
						className="border-2 border-dashed border-blue-300 rounded-lg p-8 mb-4 text-center cursor-pointer hover:bg-blue-50 transition-colors"
						onDragOver={handleDragOver}
						onDrop={handleDrop}
						onClick={() => fileInputRef.current && fileInputRef.current.click()}
					>
						<input
							type="file"
							ref={fileInputRef}
							className="hidden"
							accept=".pdf"
							onChange={handleFileChange}
						/>
						<i className="fas fa-file-pdf text-4xl text-blue-500 mb-3"></i>
						<p className="text-gray-600 mb-2">
							Drag and drop your PDF here or click to browse
						</p>
						<p className="text-sm text-gray-500">Only PDF files are accepted</p>

						{fileName && (
							<div className="mt-4 p-2 bg-blue-50 rounded flex items-center justify-between">
								<span className="text-gray-700 truncate max-w-xs">
									{fileName}
								</span>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										handleClearAll();
									}}
									className="text-red-500 hover:text-red-700"
								>
									<i className="fas fa-times"></i>
								</button>
							</div>
						)}
					</div>

					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<button
							type="button"
							onClick={handleExtract}
							disabled={!file || isLoading}
							className={`px-6 py-2 rounded-lg font-medium ${!file || isLoading ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
						>
							{isLoading ? (
								<span>
									<i className="fas fa-spinner fa-spin mr-2"></i>Extracting...
								</span>
							) : (
								<span>
									<i className="fas fa-search mr-2"></i>Extract Text
								</span>
							)}
						</button>

						<button
							type="button"
							onClick={handleSamplePDF}
							disabled={isLoading}
							className={`px-6 py-2 rounded-lg font-medium ${isLoading ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"}`}
						>
							<i className="fas fa-file-alt mr-2"></i>Use Sample PDF
						</button>

						<button
							type="button"
							onClick={handleClearAll}
							disabled={isLoading || (!file && !extractedText)}
							className={`px-6 py-2 rounded-lg font-medium ${isLoading || (!file && !extractedText) ? "bg-gray-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white"}`}
						>
							<i className="fas fa-trash-alt mr-2"></i>Clear All
						</button>
					</div>
				</div>

				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 relative">
						<strong className="font-bold">Error: </strong>
						<span className="block sm:inline">{error}</span>
					</div>
				)}

				{extractedText && (
					<div className="bg-white rounded-lg shadow-lg p-6">
						<h2 className="text-xl font-semibold text-gray-700 mb-4 flex justify-between items-center">
							<span>Extracted Text</span>
							<button
								type="button"
								onClick={() => {
									navigator.clipboard.writeText(extractedText);
								}}
								className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
							>
								<i className="fas fa-copy mr-1"></i>Copy
							</button>
						</h2>
						<div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
							<pre className="whitespace-pre-wrap font-sans text-gray-800">
								{extractedText}
							</pre>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default MainComponent;
