export default function AuthLayout({ title, subtitle, children, transparent = false, showSystemTitle = false }) {
    return (
        <div 
            className="auth-page" 
            style={transparent ? { 
                background: 'transparent',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
            } : {}}
        >
            {showSystemTitle && (
                <div style={{
                    textAlign: 'center',
                    marginBottom: '30px',
                    color: 'white',
                    textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                    zIndex: 2
                }}>
                    <h1 style={{ fontSize: '2.5rem', margin: 0 }}>
                        Digital Installation & PM Visit E-Form System
                    </h1>
                </div>
            )}

            <div 
                className="right-panel" 
                
            >
                <div className="auth-card">
                    <h2>{title}</h2>
                    <p>{subtitle}</p>
                    {children}
                </div>
            </div>
        </div>
    );
}