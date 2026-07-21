import React from "react";

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
                        <label className={summary.pmStatus === "SATISFACTORY" ? "selected" : ""}>
                            <input
                                type="radio"
                                name="pmStatus"
                                value="SATISFACTORY"
                                checked={summary.pmStatus === "SATISFACTORY"}
                                onChange={handleChange}
                            />
                            <span className="radio-label">Satisfactory</span>
                        </label>

                        <label className={summary.pmStatus === "REQUIRES_ATTENTION" ? "selected" : ""}>
                            <input
                                type="radio"
                                name="pmStatus"
                                value="REQUIRES_ATTENTION"
                                checked={summary.pmStatus === "REQUIRES_ATTENTION"}
                                onChange={handleChange}
                            />
                            <span className="radio-label">Requires Attention</span>
                        </label>

                        <label className={summary.pmStatus === "FOLLOW_UP_VISIT_REQUIRED" ? "selected" : ""}>
                            <input
                                type="radio"
                                name="pmStatus"
                                value="FOLLOW_UP_VISIT_REQUIRED"
                                checked={summary.pmStatus === "FOLLOW_UP_VISIT_REQUIRED"}
                                onChange={handleChange}
                            />
                            <span className="radio-label">Follow-up Visit Required</span>
                        </label>
                    </div>
                </div>

                <hr />

                <div className="radio-section">
                    <label className="radio-title">
                        Site Condition After PM
                    </label>

                    <div className="radio-group">
                        <label className={summary.siteCondition === "SYSTEM_OPERATIONAL" ? "selected" : ""}>
                            <input
                                type="radio"
                                name="siteCondition"
                                value="SYSTEM_OPERATIONAL"
                                checked={summary.siteCondition === "SYSTEM_OPERATIONAL"}
                                onChange={handleChange}
                            />
                            <span className="radio-label">System Operational</span>
                        </label>

                        <label className={summary.siteCondition === "SYSTEM_OPERATIONAL_WITH_ISSUES" ? "selected" : ""}>
                            <input
                                type="radio"
                                name="siteCondition"
                                value="SYSTEM_OPERATIONAL_WITH_ISSUES"
                                checked={summary.siteCondition === "SYSTEM_OPERATIONAL_WITH_ISSUES"}
                                onChange={handleChange}
                            />
                            <span className="radio-label">Operational with Observation</span>
                        </label>

                        <label className={summary.siteCondition === "SYSTEM_NOT_OPERATIONAL" ? "selected" : ""}>
                            <input
                                type="radio"
                                name="siteCondition"
                                value="SYSTEM_NOT_OPERATIONAL"
                                checked={summary.siteCondition === "SYSTEM_NOT_OPERATIONAL"}
                                onChange={handleChange}
                            />
                            <span className="radio-label">System Not Operational</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}