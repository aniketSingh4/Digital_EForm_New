import React from "react";

const physicalInspection = [
    "Sensor Enclosure Checked",
    "Mounting Structure Checked",
    "Cable Condition Checked",
    "Dust and Dirt Cleaned",
    "Water Ingress Signs Checked"
];

const powerSupply = [
    "Input Voltage Checked",
    "SMPS / Adapter Condition Checked",
    "Earthing Checked",
    "Power Connections Tightened"
];

export default function Step2Inspection({ formData, setFormData }) {

    const inspection = formData.inspection || {};

    const handleChange = (section, field, key, value) => {

        setFormData(prev => ({
            ...prev,
            inspection: {
                ...prev.inspection,
                [section]: {
                    ...prev.inspection?.[section],
                    [field]: {
                        ...prev.inspection?.[section]?.[field],
                        [key]: value
                    }
                }
            }
        }));

    };

    const renderChecklist = (title, sectionName, fields) => (

        <div className="inspection-card">

            <h3>{title}</h3>

            <div className="inspection-table">

                <div className="table-header">
                    <div>Inspection Item</div>
                    <div>Status</div>
                    <div>Remark</div>
                </div>

                {fields.map((field, index) => {

                    const item =
                        inspection?.[sectionName]?.[field] || {};

                    return (

                        <div className="table-row" key={index}>

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
                                    <option value="">Select</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
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

                <h2>Physical Inspection</h2>

                <p>
                    Verify the installation, enclosure, power supply,
                    and physical condition of the sensor.
                </p>

            </div>

            {renderChecklist(
                "1. Physical Inspection",
                "physicalInspection",
                physicalInspection
            )}

            {renderChecklist(
                "2. Power Supply",
                "powerSupply",
                powerSupply
            )}

        </div>

    );

}