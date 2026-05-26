import { useState } from "react";

export default function QuizPanel({
  showQuiz,
  quiz,
  quizLoading,
}) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  if (!showQuiz) return null;

  const score =
    quiz?.questions?.reduce((acc, q, index) => {
      return selectedAnswers[index] === q.correct_answer
        ? acc + 1
        : acc;
    }, 0) || 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-5 overflow-y-auto text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-purple-400">
          Quiz Time 🧠
        </h2>

        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">
            {quiz?.questions?.length || 0} Questions
          </span>

          {showResults && (
            <span className="text-green-400 font-semibold">
              Score: {score}/{quiz?.questions?.length}
            </span>
          )}
        </div>
      </div>

      {/* Loading */}
      {quizLoading ? (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 animate-pulse">
          <p className="text-zinc-400 mb-4">
            Generating quiz from your PDF...
          </p>

          <div className="h-5 bg-zinc-700 rounded w-2/3 mb-4"></div>

          <div className="space-y-3">
            <div className="h-10 bg-zinc-800 rounded-lg"></div>
            <div className="h-10 bg-zinc-800 rounded-lg"></div>
            <div className="h-10 bg-zinc-800 rounded-lg"></div>
            <div className="h-10 bg-zinc-800 rounded-lg"></div>
          </div>
        </div>
      ) : quiz?.questions?.length > 0 ? (
        <>
          {quiz.questions.map((q, index) => (
            <div
              key={index}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-md"
            >
              <h3 className="font-semibold text-lg mb-4">
                {index + 1}. {q.question}
              </h3>

              {q.options?.length ? (
                <div className="space-y-3">
                  {q.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (showResults) return;

                        setSelectedAnswers({
                          ...selectedAnswers,
                          [index]: idx,
                        });
                      }}
                      className={`
                        w-full text-left
                        border p-3 rounded-xl
                        transition duration-200
                        cursor-pointer

                        ${
                          showResults
                            ? idx === q.correct_answer
                              ? "bg-green-700 border-green-500"
                              : selectedAnswers[index] === idx
                              ? "bg-red-700 border-red-500"
                              : "bg-zinc-800 border-zinc-700"
                            : selectedAnswers[index] === idx
                            ? "bg-purple-700 border-purple-500"
                            : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
                        }
                      `}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-zinc-400 italic">
                  Answer verbally / think it through
                </div>
              )}
            </div>
          ))}

          {/* Submit Button */}
          {!showResults && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setShowResults(true)}
                className="
                  bg-purple-600 hover:bg-purple-700
                  px-6 py-3 rounded-xl
                  font-semibold
                  transition
                "
              >
                Submit Quiz
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-zinc-500 py-10">
          Click "Generate Quiz" to create questions 🧠
        </div>
      )}
    </div>
  );
}