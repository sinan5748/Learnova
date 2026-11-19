const pdfInput = document.getElementById("pdfInput");

const uploadButtons = [
    document.getElementById("uploadButton"),
    document.getElementById("uploadButtonHeader"),
    document.getElementById("uploadButtonHero")
];

// Open file selector when any Upload button is clicked
uploadButtons.forEach((button) => {
    if (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            pdfInput.click();
        });
    }
});

// Upload selected PDF
pdfInput.addEventListener("change", async function () {
    const file = pdfInput.files[0];

    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10 MB.");
        pdfInput.value = "";
        return;
    }

    const formData = new FormData();
    formData.append("pdf", file);

    uploadButtons.forEach((button) => {
        if (button) {
            button.dataset.originalText = button.textContent;
            button.textContent = "Uploading...";
            button.style.pointerEvents = "none";
        }
    });

    try {
        const response = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Upload failed");
        }

        // Refresh My Documents after successful upload
        await loadDocuments();

        alert(
            "PDF uploaded successfully!\n" +
            "File: " + result.filename + "\n" +
            "Pages: " + result.pages
        );

        document.getElementById("pdfViewer").style.display = "block";

        document.getElementById("pdfFileName").textContent =
            "File: " + result.filename;

        document.getElementById("pdfText").textContent = result.text;

        // Open the tool selected before uploading
        if (pendingTool) {

            const toolToOpen = pendingTool;
            pendingTool = null;

            openTool(toolToOpen);

        } else {

            document.getElementById("pdfViewer").scrollIntoView({
                behavior: "smooth"
            });

        }

    } catch (error) {
        alert("Upload failed: " + error.message);

    } finally {
        uploadButtons.forEach((button) => {
            if (button) {
                button.textContent = button.dataset.originalText || "Upload PDF";
                button.style.pointerEvents = "auto";
            }
        });

        pdfInput.value = "";
    }
});

// Ask a question about the uploaded PDF
document.getElementById("askButton").addEventListener("click", async function () {

    const question = document.getElementById("questionInput").value.trim();
    const answerBox = document.getElementById("chatAnswer");
    const askButton = document.getElementById("askButton");

    if (!question) {
        alert("Please enter a question.");
        return;
    }

    answerBox.innerHTML = `
    <div class="chat-loading">
        <div class="loading-spinner"></div>
        <span>AI is thinking...</span>
    </div>
    `;

    askButton.disabled = true;
    askButton.textContent = "Generating...";

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: document.getElementById("pdfText").textContent,
                question: question
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Something went wrong");
        }

        answerBox.innerHTML = "";

        const answerHeading = document.createElement("h4");
        answerHeading.textContent = "✨ AI Answer";

        const answerContent = document.createElement("div");
        answerContent.className = "answer-content";
        answerContent.innerHTML = DOMPurify.sanitize(marked.parse(result.answer));

        answerBox.appendChild(answerHeading);
        answerBox.appendChild(answerContent);

    } catch (error) {
    answerBox.textContent = "Error: " + error.message;

    } finally {
        askButton.disabled = false;
        askButton.textContent = "Ask AI";
    }
});


// Store the tool selected before PDF upload
let pendingTool = null;

// Handle feature card clicks
document.querySelectorAll(".study-feature-card").forEach((card) => {

    card.addEventListener("click", function () {

        const selectedTool = this.dataset.tool;

        // Check whether a PDF has already been uploaded
        const pdfText = document.getElementById("pdfText").textContent.trim();

       // Text Studio does not require a PDF
        if (selectedTool === "text") {
            document.getElementById("pdfViewer").style.display = "none";
            document.getElementById("textStudioSection").style.display = "block";

            document.getElementById("textStudioSection").scrollIntoView({
                behavior: "smooth"
            });

            return;
        }

        // Other tools require a PDF
        if (!pdfText) {
            pendingTool = selectedTool;
            pdfInput.click();
            return;
        }

        openTool(selectedTool);

    });

});

// Open the selected tool



function openTool(tool) {

    const pdfViewer = document.getElementById("pdfViewer");
    const summarySection = document.getElementById("summarySection");
    const examSection = document.getElementById("examSection");
    const mcqSection = document.getElementById("mcqSection");

    const chatBox = document.querySelector(".pdf-chat-box");
    const chatAnswer = document.getElementById("chatAnswer");

    // Hide all tool sections first
    chatBox.style.display = "none";
    chatAnswer.style.display = "none";
    summarySection.style.display = "none";
    examSection.style.display = "none";
    mcqSection.style.display = "none";

    if (tool === "chat") {

        chatBox.style.display = "block";
        chatAnswer.style.display = "block";

        pdfViewer.scrollIntoView({
            behavior: "smooth"
        });

    }

    else if (tool === "summary") {

        summarySection.style.display = "block";

        summarySection.scrollIntoView({
            behavior: "smooth"
        });

    }

    else if (tool === "exam") {

        examSection.style.display = "block";

        examSection.scrollIntoView({
            behavior: "smooth"
        });

    }

    else if (tool === "mcq") {

        mcqSection.style.display = "block";

        mcqSection.scrollIntoView({
            behavior: "smooth"
        });

    }

}





// Generate PDF Summary
document.getElementById("generateSummaryButton").addEventListener("click", async function () {

    const summaryButton = this;
    const summaryResult = document.getElementById("summaryResult");

    summaryButton.disabled = true;
    summaryButton.textContent = "Generating Summary...";

    summaryResult.textContent = "AI is preparing your summary...";

    try {

        const response = await fetch("/summary", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: document.getElementById("pdfText").textContent
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Summary generation failed");
        }

        summaryResult.innerHTML = DOMPurify.sanitize(marked.parse(result.summary));

    } catch (error) {

        summaryResult.textContent = "Error: " + error.message;

    } finally {

        summaryButton.disabled = false;
        summaryButton.textContent = "Generate Summary";

    }

});



// Generate Exam Answer
document.getElementById("generateExamButton").addEventListener("click", async function () {

    const question = document.getElementById("examQuestion").value.trim();
    const marks = document.getElementById("examMarks").value;
    const examResult = document.getElementById("examResult");
    const examButton = this;

    if (!question) {
        alert("Please enter your exam question.");
        return;
    }

    examButton.disabled = true;
    examButton.textContent = "Generating Answer...";

    examResult.textContent = "AI is preparing your answer...";

    try {

        const response = await fetch("/exam", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: document.getElementById("pdfText").textContent,
                question: question,
                marks: marks
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Answer generation failed");
        }

        examResult.innerHTML = DOMPurify.sanitize(marked.parse(result.answer));

    } catch (error) {

        examResult.textContent = "Error: " + error.message;

    } finally {

        examButton.disabled = false;
        examButton.textContent = "Generate Answer";

    }

});


// Generate MCQs
document.getElementById("generateMCQButton").addEventListener("click", async function () {

    const count = Number(document.getElementById("mcqCount").value);
    const mcqResult = document.getElementById("mcqResult");
    const mcqButton = this;

    mcqButton.disabled = true;
    mcqButton.textContent = "Generating MCQs...";

    mcqResult.textContent = "AI is preparing your questions...";

    try {

        const response = await fetch("/mcq", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: document.getElementById("pdfText").textContent,
                count: count
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "MCQ generation failed");
        }

        mcqResult.innerHTML = "";

        result.questions.forEach((item, index) => {

            const questionCard = document.createElement("div");
            questionCard.className = "mcq-question-card";

            const heading = document.createElement("h5");
            heading.textContent = `${index + 1}. ${item.question}`;

            questionCard.appendChild(heading);

           Object.entries(item.options).forEach(([key, value]) => {

                const optionLabel = document.createElement("label");
                optionLabel.className = "mcq-option";

                const radio = document.createElement("input");
                radio.type = "radio";
                radio.name = `question-${index}`;
                radio.value = key;

                const optionText = document.createElement("span");
                optionText.textContent = `${key}. ${value}`;

                optionLabel.appendChild(radio);
                optionLabel.appendChild(optionText);

                questionCard.appendChild(optionLabel);
            });

            mcqResult.appendChild(questionCard);

        });

        // Submit Quiz Button
        const submitButton = document.createElement("button");
        submitButton.textContent = "Submit Answers";
        submitButton.type = "button";
        submitButton.id = "submitMCQButton";

        mcqResult.appendChild(submitButton);

        // Quiz Result
        const quizScore = document.createElement("div");
        quizScore.id = "quizScore";
        mcqResult.appendChild(quizScore);

        // Retake Quiz Button
        const retakeButton = document.createElement("button");
        retakeButton.textContent = "Retake Quiz";
        retakeButton.type = "button";
        retakeButton.id = "retakeMCQButton";
        retakeButton.style.display = "none";

        mcqResult.appendChild(retakeButton);

        submitButton.addEventListener("click", function () {

            let score = 0;

            const questionCards = mcqResult.querySelectorAll(".mcq-question-card");

            result.questions.forEach((item, index) => {

                const selectedOption = document.querySelector(
                    `input[name="question-${index}"]:checked`
                );

                const questionCard = questionCards[index];

                if (selectedOption && selectedOption.value === item.correct_answer) {
                    score++;
                }

                let feedback = document.createElement("p");
                feedback.className = "mcq-feedback";

                if (selectedOption && selectedOption.value === item.correct_answer) {
                    feedback.textContent = "Correct answer!";
                } else {
                    feedback.textContent =
                        `Correct answer: ${item.correct_answer}. ${item.options[item.correct_answer]}`;
                }

                const explanation = document.createElement("p");
                explanation.className = "mcq-explanation";
                explanation.textContent = "Explanation: " + item.explanation;

                questionCard.appendChild(feedback);
                questionCard.appendChild(explanation);
            });

            // Disable all options after submission
            mcqResult.querySelectorAll('input[type="radio"]').forEach((radio) => {
                radio.disabled = true;
            });

            const totalQuestions = result.questions.length;

            const percentage = Math.round(
                (score / totalQuestions) * 100
            );

            let performanceMessage;

            if (percentage === 100) {
                performanceMessage = "Excellent! Perfect score!";
            } else if (percentage >= 80) {
                performanceMessage = "Great job! Keep it up!";
            } else if (percentage >= 60) {
                performanceMessage = "Good effort! Keep practising!";
            } else {
                performanceMessage = "Keep learning. You can improve!";
            }

            quizScore.textContent =
                `Your Score: ${score}/${totalQuestions} (${percentage}%)\n${performanceMessage}`;
                            

            submitButton.disabled = true;
            submitButton.textContent = "Quiz Submitted";
            retakeButton.style.display = "inline-block";
        });

        // Retake Quiz Function
        retakeButton.addEventListener("click", function () {

            mcqResult.querySelectorAll('input[type="radio"]').forEach((radio) => {
                radio.checked = false;
                radio.disabled = false;
            });

            mcqResult.querySelectorAll(".mcq-feedback, .mcq-explanation").forEach((element) => {
                element.remove();
            });

            quizScore.textContent = "";

            submitButton.disabled = false;
            submitButton.textContent = "Submit Answers";

            retakeButton.style.display = "none";
        });

    } catch (error) {

        mcqResult.textContent = "Error: " + error.message;

    } finally {

        mcqButton.disabled = false;
        mcqButton.textContent = "Generate MCQs";

    }

});

// Load My Documents
async function loadDocuments() {

    const documentsList = document.getElementById("documentsList");

    try {

        const response = await fetch("/documents");
        const result = await response.json();

        documentsList.innerHTML = "";

        if (result.documents.length === 0) {
            documentsList.textContent = "No documents found yet.";
            return;
        }

        result.documents.forEach((doc) => {

            const documentCard = document.createElement("div");
            documentCard.className = "document-card";

            const fileName = document.createElement("h5");
            fileName.textContent = doc.filename;

            const fileSize = document.createElement("p");
            fileSize.textContent = `File size: ${doc.size} KB`;

           documentCard.appendChild(fileName);
           documentCard.appendChild(fileSize);
           // Use previously uploaded PDF
            const useButton = document.createElement("button");
            useButton.textContent = "Use PDF";
            useButton.className = "document-use-button";
            useButton.type = "button";

            useButton.addEventListener("click", async function () {

                try {
                    useButton.disabled = true;
                    useButton.textContent = "Loading...";

                    const response = await fetch(
                        `/documents/${encodeURIComponent(doc.filename)}/load`
                    );

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.error || "Unable to load PDF");
                    }

                    document.getElementById("pdfText").textContent = result.text;

                    // Display the PDF viewer
                    document.getElementById("pdfViewer").style.display = "block";

                    // Show document details
                    const pdfInfo = document.getElementById("pdfInfo");

                    if (pdfInfo) {
                        pdfInfo.textContent = `${result.filename} (${result.pages} pages)`;
                    }

                    // Navigate to PDF viewer
                    document.getElementById("pdfViewer").scrollIntoView({
                        behavior: "smooth"
                    });

                    alert("PDF loaded successfully!");

                } catch (error) {
                    alert("Error: " + error.message);

                } finally {
                    useButton.disabled = false;
                    useButton.textContent = "Use PDF";
                }
            });

            documentCard.appendChild(useButton);

            // Open PDF Button
            const openButton = document.createElement("a");

            openButton.textContent = "Open PDF";
            openButton.href = `/documents/${encodeURIComponent(doc.filename)}`;
            openButton.target = "_blank";
            openButton.className = "document-open-button";

            documentCard.appendChild(openButton);

            // Delete PDF Button
            const deleteButton = document.createElement("button");

            deleteButton.textContent = "Delete";
            deleteButton.className = "document-delete-button";
            deleteButton.type = "button";

            deleteButton.addEventListener("click", async function () {

                const confirmDelete = confirm(
                    `Are you sure you want to delete ${doc.filename}?`
                );

                if (!confirmDelete) {
                    return;
                }

                try {

                    const response = await fetch(
                        `/documents/${encodeURIComponent(doc.filename)}`,
                        {
                            method: "DELETE"
                        }
                    );

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.error || "Delete failed");
                    }

                    alert("PDF deleted successfully!");

                    loadDocuments();

                } catch (error) {

                    alert("Error: " + error.message);

                }

            });

            documentCard.appendChild(deleteButton);

            documentsList.appendChild(documentCard);

        });

    } catch (error) {

        documentsList.textContent = "Unable to load documents.";

    }
}

// Load documents when website opens
loadDocuments();


// ========================================
// TEXT STUDIO WORD & CHARACTER COUNTER
// ========================================

const studioText = document.getElementById("studioText");
const studioWordCount = document.getElementById("studioWordCount");
const studioCharCount = document.getElementById("studioCharCount");

studioText.addEventListener("input", function () {

    const text = studioText.value;

    // Count characters
    studioCharCount.textContent = text.length;

    // Count words
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);

    studioWordCount.textContent = words.length;

});



// ========================================
// TEXT STUDIO ACTION BUTTONS
// ========================================

const studioActionButtons = document.querySelectorAll("[data-text-action]");

const studioInputs = document.getElementById("textStudioInputs");
const studioChatInput = document.getElementById("studioChatInput");
const studioExamInput = document.getElementById("studioExamInput");
const studioMCQInput = document.getElementById("studioMCQInput");
const studioGenerateButton = document.getElementById("studioGenerateButton");
const textStudioResult = document.getElementById("textStudioResult");

let currentStudioAction = null;
studioActionButtons.forEach(button => {

    button.addEventListener("click", function () {

        const action = this.dataset.textAction;
        currentStudioAction = action;
        // Show the input area
        studioInputs.style.display = "block";

        // Hide all additional inputs
        studioChatInput.style.display = "none";
        studioExamInput.style.display = "none";
        studioMCQInput.style.display = "none";

        // Hide previous result
        textStudioResult.style.display = "none";

        // Display the selected tool's inputs
        if (action === "chat") {
            studioChatInput.style.display = "block";
            studioGenerateButton.textContent = "Ask AI";
        }

        else if (action === "summary") {
            studioGenerateButton.textContent = "Generate Summary";
        }

        else if (action === "exam") {
            studioExamInput.style.display = "block";
            studioGenerateButton.textContent = "Generate Answer";
        }

        else if (action === "mcq") {
            studioMCQInput.style.display = "block";
            studioGenerateButton.textContent = "Generate MCQs";
        }

    });

});


// ========================================
// TEXT STUDIO GEMINI CONNECTION
// ========================================

studioGenerateButton.addEventListener("click", async function () {

    const text = studioText.value.trim();

    if (!text) {
        alert("Please enter some text first.");
        return;
    }

    const action = currentStudioAction;

    if (!action) {
        alert("Please select an AI tool.");
        return;
    }

    const data = {
        action: action,
        text: text
    };

    // Get additional inputs
    if (action === "chat") {
        data.question = document.getElementById("studioQuestion").value.trim();

        if (!data.question) {
            alert("Please enter your question.");
            return;
        }
    }

    else if (action === "exam") {
        data.question = document.getElementById("studioExamQuestion").value.trim();
        data.marks = document.getElementById("studioExamMarks").value;

        if (!data.question) {
            alert("Please enter your exam question.");
            return;
        }
    }

    else if (action === "mcq") {
        data.count = Number(document.getElementById("studioMCQCount").value);

        if (!Number.isInteger(data.count) || data.count < 1 || data.count > 20) {
            alert("Choose between 1 and 20 questions.");
            return;
        }
    }

    const originalButtonText = this.textContent;

    this.disabled = true;
    this.textContent = "Generating...";

    textStudioResult.style.display = "block";
    textStudioResult.innerHTML = "Please wait. AI is generating your response...";

    try {

        const response = await fetch("/text-studio", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Something went wrong.");
        }

        
        if (action === "mcq") {

            textStudioResult.innerHTML = "";

            result.questions.forEach((item, index) => {

                const questionCard = document.createElement("div");
                questionCard.className = "mcq-question-card";

                const heading = document.createElement("h5");
                heading.textContent = `${index + 1}. ${item.question}`;

                questionCard.appendChild(heading);

                Object.entries(item.options).forEach(([key, value]) => {

                    const optionLabel = document.createElement("label");
                    optionLabel.className = "mcq-option";

                    const radio = document.createElement("input");
                    radio.type = "radio";
                    radio.name = `studio-question-${index}`;
                    radio.value = key;

                    const optionText = document.createElement("span");
                    optionText.textContent = `${key}. ${value}`;

                    optionLabel.appendChild(radio);
                    optionLabel.appendChild(optionText);

            questionCard.appendChild(optionLabel);

        });

        textStudioResult.appendChild(questionCard);

    });

    // Submit Quiz Button
    const submitButton = document.createElement("button");
    submitButton.textContent = "Submit Answers";
    submitButton.type = "button";
    submitButton.className = "studio-mcq-submit";

    textStudioResult.appendChild(submitButton);

    // Quiz Score
    const quizScore = document.createElement("div");
    quizScore.className = "studio-mcq-score";

    textStudioResult.appendChild(quizScore);

    // Retake Quiz Button
    const retakeButton = document.createElement("button");
    retakeButton.textContent = "Retake Quiz";
    retakeButton.type = "button";
    retakeButton.className = "studio-mcq-retake";
    retakeButton.style.display = "none";

    textStudioResult.appendChild(retakeButton);

    // Submit Answers
    submitButton.addEventListener("click", function () {

        let score = 0;

        const questionCards = textStudioResult.querySelectorAll(
            ".mcq-question-card"
        );

        result.questions.forEach((item, index) => {

            const questionCard = questionCards[index];

            const selectedOption = questionCard.querySelector(
                'input[type="radio"]:checked'
            );

            if (selectedOption && selectedOption.value === item.correct_answer) {
                score++;
            }

            const feedback = document.createElement("p");
            feedback.className = "mcq-feedback";

            if (selectedOption && selectedOption.value === item.correct_answer) {
                feedback.textContent = "Correct answer!";
            } else {
                feedback.textContent =
                    `Correct answer: ${item.correct_answer}. ${item.options[item.correct_answer]}`;
            }

            const explanation = document.createElement("p");
            explanation.className = "mcq-explanation";
            explanation.textContent = "Explanation: " + item.explanation;

            questionCard.appendChild(feedback);
            questionCard.appendChild(explanation);

        });

        // Disable options after submission
        textStudioResult.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.disabled = true;
        });

        const totalQuestions = result.questions.length;

        const percentage = Math.round((score / totalQuestions) * 100);

        let performanceMessage;

        if (percentage === 100) {
            performanceMessage = "Excellent! Perfect score!";
        } else if (percentage >= 80) {
            performanceMessage = "Great job! Keep it up!";
        } else if (percentage >= 60) {
            performanceMessage = "Good effort! Keep practising!";
        } else {
            performanceMessage = "Keep learning. You can improve!";
        }

        quizScore.textContent =
            `Your Score: ${score}/${totalQuestions} (${percentage}%)\n${performanceMessage}`;

        submitButton.disabled = true;
        submitButton.textContent = "Quiz Submitted";

        retakeButton.style.display = "inline-block";

    });

    // Retake Quiz
    retakeButton.addEventListener("click", function () {

        textStudioResult.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = false;
            radio.disabled = false;
        });

        textStudioResult.querySelectorAll(
            ".mcq-feedback, .mcq-explanation"
        ).forEach(element => {
            element.remove();
        });

        quizScore.textContent = "";

        submitButton.disabled = false;
        submitButton.textContent = "Submit Answers";

        retakeButton.style.display = "none";

    });

} else {

    textStudioResult.innerHTML = DOMPurify.sanitize(
        marked.parse(result.result || "No response received.")
    );

}


    }

    catch (error) {

        textStudioResult.textContent = "Error: " + error.message;

    }

    finally {

        this.disabled = false;
        this.textContent = originalButtonText;

    }

});





