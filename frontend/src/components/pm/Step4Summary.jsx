import React from "react";
import { PM_STATUS_OPTIONS, SITE_CONDITION_OPTIONS } from "../../utils/pmSummary";

export default function Step4Summary({ formData, setFormData }) {

    const summary = formData.summary || {};

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            summary: {
                ...prev.summary,
                [name]: value
            }
        }));
    };

    return (
        <div className="step-container">
            <div className="section-header">
                <h2>Observation & PM Summary</h2>
                <p>
                    Enter observations, recommendations and overall maintenance status.
                </p>
            </div>

            {/* Observation */}
            <div className="summary-card">
                <h3>7. Observation</h3>
                <textarea
                    rows="5"
                    name="observation"
                    value={summary.observation || ""}
                    onChange={handleChange}
                    placeholder="Enter observations..."
                />
            </div>

            {/* Recommendation */}
            <div className="summary-card">
                <h3>8. Recommendation / Corrective Actions Required</h3>
                <textarea
                    rows="5"
                    name="recommendation"
                    value={summary.recommendation || ""}
                    onChange={handleChange}
                    placeholder="Enter recommendations..."
                />
            </div>

            {/* PM Summary */}
            <div className="summary-card">
                <h3>9. PM Summary</h3>

                <div className="radio-section">
                    <label className="radio-title">
                        Preventive Maintenance Status
                    </label>

                    <div className="radio-group">
                        {PM_STATUS_OPTIONS.map((option) => (
                            <label key={option.value} className={summary.pmStatus === option.value ? "selected" : ""}>
                                <input
                                    type="radio"
                                    name="pmStatus"
                                    value={option.value}
                                    checked={summary.pmStatus === option.value}
                                    onChange={handleChange}
                                />
                                <span className="radio-label">{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <hr />

                <div className="radio-section">
                    <label className="radio-title">
                        Site Condition After PM
                    </label>

                    <div className="radio-group">
                        {SITE_CONDITION_OPTIONS.map((option) => (
                            <label key={option.value} className={summary.siteCondition === option.value ? "selected" : ""}>
                                <input
                                    type="radio"
                                    name="siteCondition"
                                    value={option.value}
                                    checked={summary.siteCondition === option.value}
                                    onChange={handleChange}
                                />
                                <span className="radio-label">{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}