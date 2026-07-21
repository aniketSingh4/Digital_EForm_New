import React, { useEffect } from "react";

export default function Step5SignOff({ formData, setFormData }) {

    const signoff = formData.signoff || {};

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            signoff: {
                ...prev.signoff,
                [name]: value
            }
        }));
    };

    // Auto-set current date for both client and engineer
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        
        if (!signoff.clientDate) {
            setFormData(prev => ({
                ...prev,
                signoff: {
                    ...prev.signoff,
                    clientDate: today
                }
            }));
        }
        
        if (!signoff.serviceEngineerDate) {
            setFormData(prev => ({
                ...prev,
                signoff: {
                    ...prev.signoff,
                    serviceEngineerDate: today
                }
            }));
        }
    }, []);

    const isBothSigned = signoff.clientSignature && signoff.serviceEngineerSignature;
    const isClientFilled = signoff.clientRepresentativeName && signoff.designation && signoff.clientSignature;
    const isEngineerFilled = signoff.serviceEngineerName && signoff.serviceEngineerSignature;

    return (
        <div style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '20px 24px',
            animation: 'fadeIn 0.4s ease'
        }}>
            {/* Header */}
            <div style={{
                textAlign: 'center',
                marginBottom: '35px',
                padding: '20px 0 10px 0'
            }}>
                <h2 style={{
                    fontSize: '32px',
                    color: '#1e3a8a',
                    marginBottom: '10px',
                    fontWeight: '700',
                    letterSpacing: '-0.5px'
                }}>
                    Sign Off
                </h2>
                <p style={{
                    color: '#64748b',
                    fontSize: '16px',
                    maxWidth: '600px',
                    margin: '0 auto',
                    lineHeight: '1.6'
                }}>
                    Both the Client Representative and Service Engineer must sign
                    before the Preventive Maintenance Report can be submitted.
                </p>
            </div>

            {/* Status Bar */}
            <div style={{
                padding: '14px 24px',
                borderRadius: '12px',
                marginBottom: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                background: isBothSigned ? '#f0fdf4' : '#fffbeb',
                border: isBothSigned ? '1px solid #bbf7d0' : '1px solid #fde68a',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <span style={{
                        fontSize: '24px'
                    }}>
                        {isBothSigned ? '✅' : '⚠️'}
                    </span>
                    <span style={{
                        fontWeight: '600',
                        color: isBothSigned ? '#15803d' : '#92400e',
                        fontSize: '15px'
                    }}>
                        {isBothSigned 
                            ? 'Both signatures provided. Ready to submit!' 
                            : 'Please provide both client and engineer signatures.'}
                    </span>
                </div>
                <div style={{
                    display: 'flex',
                    gap: '20px',
                    fontSize: '13px',
                    color: '#6b7280'
                }}>
                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <span style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: isClientFilled ? '#22c55e' : '#e5e7eb'
                        }}></span>
                        Client: {isClientFilled ? '✓' : 'Pending'}
                    </span>
                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <span style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: isEngineerFilled ? '#22c55e' : '#e5e7eb'
                        }}></span>
                        Engineer: {isEngineerFilled ? '✓' : 'Pending'}
                    </span>
                </div>
            </div>

            {/* Two Column Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                gap: '30px'
            }}>
                {/* ========================= CLIENT ========================= */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '28px 32px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.3s ease'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '24px',
                        paddingBottom: '16px',
                        borderBottom: '2px solid #eff6ff'
                    }}>
                        <span style={{
                            fontSize: '28px'
                        }}>👤</span>
                        <h3 style={{
                            margin: 0,
                            color: '#1e3a8a',
                            fontSize: '20px',
                            fontWeight: '700'
                        }}>
                            Client Representative
                        </h3>
                        {isClientFilled && (
                            <span style={{
                                marginLeft: 'auto',
                                fontSize: '20px',
                                color: '#22c55e'
                            }}>✓</span>
                        )}
                    </div>

                    {/* Client Name */}
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '14px'
                        }}>
                            Representative Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            name="clientRepresentativeName"
                            value={signoff.clientRepresentativeName || ""}
                            onChange={handleChange}
                            placeholder="Enter Representative Name"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: '1px solid #d1d5db',
                                fontSize: '15px',
                                transition: 'all 0.25s ease',
                                background: '#f8fafc',
                                boxSizing: 'border-box',
                                outline: 'none'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#2563eb';
                                e.target.style.background = '#ffffff';
                                e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#d1d5db';
                                e.target.style.background = '#f8fafc';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Designation */}
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '14px'
                        }}>
                            Designation <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            name="designation"
                            value={signoff.designation || ""}
                            onChange={handleChange}
                            placeholder="Enter Designation"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: '1px solid #d1d5db',
                                fontSize: '15px',
                                transition: 'all 0.25s ease',
                                background: '#f8fafc',
                                boxSizing: 'border-box',
                                outline: 'none'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#2563eb';
                                e.target.style.background = '#ffffff';
                                e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#d1d5db';
                                e.target.style.background = '#f8fafc';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Client Date */}
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '14px'
                        }}>
                            Date <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="date"
                            name="clientDate"
                            value={signoff.clientDate || ""}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: '1px solid #d1d5db',
                                fontSize: '15px',
                                transition: 'all 0.25s ease',
                                background: '#f8fafc',
                                boxSizing: 'border-box',
                                outline: 'none',
                                color: '#1f2937'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#2563eb';
                                e.target.style.background = '#ffffff';
                                e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#d1d5db';
                                e.target.style.background = '#f8fafc';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Client Signature - Text Field */}
                    <div style={{ marginBottom: '4px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '14px'
                        }}>
                            Signature (Full Name) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            name="clientSignature"
                            value={signoff.clientSignature || ""}
                            onChange={handleChange}
                            placeholder="Enter Client's Full Name as Signature"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: signoff.clientSignature ? '2px solid #22c55e' : '1px solid #d1d5db',
                                fontSize: '15px',
                                transition: 'all 0.25s ease',
                                background: signoff.clientSignature ? '#f0fdf4' : '#f8fafc',
                                boxSizing: 'border-box',
                                outline: 'none',
                                fontFamily: signoff.clientSignature ? 'cursive' : 'inherit',
                                fontSize: signoff.clientSignature ? '18px' : '15px'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#2563eb';
                                e.target.style.background = '#ffffff';
                                e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.1)';
                            }}
                            onBlur={(e) => {
                                if (e.target.value) {
                                    e.target.style.borderColor = '#22c55e';
                                    e.target.style.background = '#f0fdf4';
                                } else {
                                    e.target.style.borderColor = '#d1d5db';
                                    e.target.style.background = '#f8fafc';
                                }
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                        <small style={{
                            color: '#6b7280',
                            fontSize: '12px',
                            marginTop: '6px',
                            display: 'block'
                        }}>
                            💡 Please enter your full name as your digital signature.
                        </small>
                    </div>
                </div>

                {/* ========================= ENGINEER ========================= */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '28px 32px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.3s ease'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '24px',
                        paddingBottom: '16px',
                        borderBottom: '2px solid #eff6ff'
                    }}>
                        <span style={{
                            fontSize: '28px'
                        }}>👨‍🔧</span>
                        <h3 style={{
                            margin: 0,
                            color: '#1e3a8a',
                            fontSize: '20px',
                            fontWeight: '700'
                        }}>
                            Service Engineer
                        </h3>
                        {isEngineerFilled && (
                            <span style={{
                                marginLeft: 'auto',
                                fontSize: '20px',
                                color: '#22c55e'
                            }}>✓</span>
                        )}
                    </div>

                    {/* Engineer Name */}
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '14px'
                        }}>
                            Engineer Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            name="serviceEngineerName"
                            value={signoff.serviceEngineerName || ""}
                            onChange={handleChange}
                            placeholder="Enter Engineer Name"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: '1px solid #d1d5db',
                                fontSize: '15px',
                                transition: 'all 0.25s ease',
                                background: '#f8fafc',
                                boxSizing: 'border-box',
                                outline: 'none'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#2563eb';
                                e.target.style.background = '#ffffff';
                                e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#d1d5db';
                                e.target.style.background = '#f8fafc';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Engineer Date */}
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '14px'
                        }}>
                            Date <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="date"
                            name="serviceEngineerDate"
                            value={signoff.serviceEngineerDate || ""}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: '1px solid #d1d5db',
                                fontSize: '15px',
                                transition: 'all 0.25s ease',
                                background: '#f8fafc',
                                boxSizing: 'border-box',
                                outline: 'none',
                                color: '#1f2937'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#2563eb';
                                e.target.style.background = '#ffffff';
                                e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#d1d5db';
                                e.target.style.background = '#f8fafc';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Engineer Signature - Text Field */}
                    <div style={{ marginBottom: '4px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '14px'
                        }}>
                            Signature (Full Name) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            name="serviceEngineerSignature"
                            value={signoff.serviceEngineerSignature || ""}
                            onChange={handleChange}
                            placeholder="Enter Engineer's Full Name as Signature"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: signoff.serviceEngineerSignature ? '2px solid #22c55e' : '1px solid #d1d5db',
                                fontSize: '15px',
                                transition: 'all 0.25s ease',
                                background: signoff.serviceEngineerSignature ? '#f0fdf4' : '#f8fafc',
                                boxSizing: 'border-box',
                                outline: 'none',
                                fontFamily: signoff.serviceEngineerSignature ? 'cursive' : 'inherit',
                                fontSize: signoff.serviceEngineerSignature ? '18px' : '15px'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#2563eb';
                                e.target.style.background = '#ffffff';
                                e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.1)';
                            }}
                            onBlur={(e) => {
                                if (e.target.value) {
                                    e.target.style.borderColor = '#22c55e';
                                    e.target.style.background = '#f0fdf4';
                                } else {
                                    e.target.style.borderColor = '#d1d5db';
                                    e.target.style.background = '#f8fafc';
                                }
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                        <small style={{
                            color: '#6b7280',
                            fontSize: '12px',
                            marginTop: '6px',
                            display: 'block'
                        }}>
                            💡 Please enter your full name as your digital signature.
                        </small>
                    </div>
                </div>
            </div>

            {/* Animated fadeIn */}
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .step-container {
                    animation: fadeIn 0.4s ease;
                }
            `}</style>
        </div>
    );
}