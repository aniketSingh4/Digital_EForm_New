export default function AuthLayout({ title, subtitle, children }) {
    return (
        <div className="auth-page">

            <div className="left-panel">

                <h1>Digital Installation And PM Visit E-Form System</h1>

                <p>
                    This system is designed to streamline the process of digital installation and PM visits, providing a user-friendly interface for managing and submitting forms efficiently.
                </p>

            </div>

            <div className="right-panel">

                <div className="auth-card">

                    <h2>{title}</h2>

                    <p>{subtitle}</p>

                    {children}

                </div>

            </div>

        </div>
    );
}