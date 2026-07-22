// import node module libraries
import { Menu } from 'react-feather';
import {
	Nav,
	Navbar,
	Form
} from 'react-bootstrap';

// import sub components
import QuickMenu from 'layouts/QuickMenu';

const NavbarTop = ({ buttonRef, navigationVisible, onToggle }) => {
	return (
		<Navbar expand="lg" className="navbar-classic">
			<div className='d-flex justify-content-between w-100'>
				<div className="d-flex align-items-center">
					<button
						ref={buttonRef}
						type="button"
						id="nav-toggle"
						className="nav-icon-button me-2 icon-xs"
						aria-label={navigationVisible ? "Close dashboard navigation" : "Open dashboard navigation"}
						aria-controls="dashboard-navigation"
						aria-expanded={navigationVisible}
						onClick={onToggle}>
						<Menu size="18px" aria-hidden="true" />
					</button>
					<div className="ms-lg-3 d-none d-md-none d-lg-block">
						{/* Search Form */}
						<Form className="d-flex align-items-center">
							<Form.Control type="search" placeholder="Search" aria-label="Search dashboard" />
						</Form>
					</div>
				</div>
				{/* Quick Menu */}
				<Nav className="navbar-right-wrap ms-2 d-flex nav-top-wrap">
					<QuickMenu />
				</Nav>
			</div>
		</Navbar>
	);
};

export default NavbarTop;
