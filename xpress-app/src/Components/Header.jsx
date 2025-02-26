
function Header(){

    return (
        <header className="header">
            <div className="logo">Xpress Auto Care</div>
            <nav>
                <ul>
                    <li><a href="#">Home</a></li>
                    <li><a href="#">Services</a></li>
                    <li><a href="#">Log In</a></li>
                    <li><a href="#">About Us</a></li>
                    <li><a href="#">Locations</a></li>
                </ul>
            </nav>
            <div className="icons">
                <button>🔍</button> {/* Search Icon */}
                <button>📞</button> {/* Contact Icon */}
                <button>🌍</button> {/* Language Icon */}
            </div>
        </header>
    );
}

export default Header