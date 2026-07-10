const steps = [
    "Basic Info",
    "Inspection",
    "Technical",
    "Summary",
    "Sign Off",
    "Review"
];

export default function ProgressBar({ step }) {

    return (

        <div className="progress-container">

            {
                steps.map((item, index) => (

                    <div
                        className="progress-step"
                        key={index}
                    >

                        <div
                            className={
                                index + 1 <= step
                                    ? "circle active"
                                    : "circle"
                            }
                        >
                            {index + 1}
                        </div>

                        <p>{item}</p>

                    </div>

                ))
            }

        </div>

    );
}