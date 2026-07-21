import React from "react";

const sensorHealth = [
    "PM2.5 Sensor Status Checked",
    "PM10 Sensor Status Checked",
    "Temperature Status Checked",
    "Humidity Status Checked",
    "Data Accuracy Checked"
];

const communication = [
    "SIM Card Status Checked",
    "Network Signal Strength Checked",
    "Data Transmission Verified",
    "Dashboard Connectivity Checked"
];

const calibration = [
    "Sensor Reading Verified",
    "Calibration Status Checked",
    "Error Logs Reviewed",
    "Firmware Version Checked"
];

const cleaning = [
    "Sensor Chamber Cleaned",
    "Air Inlet / Outlet Cleaned",
    "Enclosure Cleaned"
];

export default function Step3Technical({ formData, setFormData }) {

    const technical = formData.technical || {};

    const handleChange = (section, field, key, value) => {

        setFormData(prev => ({
            ...prev,
            technical: {
                ...prev.technical,
                [section]: {
                    ...prev.technical?.[section],
                    [field]: {
                        ...prev.technical?.[section]?.[field],
                        [key]: value
                    }
                }
            }
        }));

    };

    const renderSection = (title, sectionName, fields) => (

        <div className="inspection-card">

            <h3>{title}</h3>

            <div className="inspection-table">

                <div className="table-header">
                    <div>Inspection Item</div>
                    <div>Status</div>
                    <div>Remark</div>
                </div>

                {fields.map((field) => {

                    const item =
                        technical?.[sectionName]?.[field] || {};

                    return (

                        <div
                            className="table-row"
                            key={field}
                        >

                            <div className="item-name">
                                {field}
                            </div>

                            <div>

                                <select
                                    value={item.status || ""}
                                    onChange={(e) =>
                                        handleChange(
                                            sectionName,
                                            field,
                                            "status",
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        Select
                                    </option>

                                    <option value="Yes">
                                        Yes
                                    </option>

                                    <option value="No">
                                        No
                                    </option>

                                </select>

                            </div>

                            <div>

                                <input
                                    type="text"
                                    placeholder="Remark..."
                                    value={item.remark || ""}
                                    onChange={(e) =>
                                        handleChange(
                                            sectionName,
                                            field,
                                            "remark",
                                            e.target.value
                                        )
                                    }
                                />

                            </div>

                        </div>

                    );

                })}

            </div>

        </div>

    );

    return (

        <div className="step-container">

            <div className="section-header">

                <h2>Technical Verification</h2>

                <p>
                    Verify sensor health, communication,
                    calibration, and cleaning activities.
                </p>

            </div>

            {renderSection(
                "3. Sensor Health Check",
                "sensorHealth",
                sensorHealth
            )}

            {renderSection(
                "4. Communication Check",
                "communication",
                communication
            )}

            {renderSection(
                "5. Calibration & Performance Verification",
                "calibration",
                calibration
            )}

            {renderSection(
                "6. Cleaning Activity",
                "cleaning",
                cleaning
            )}

        </div>

    );

}