import React from "react"

import "common/rocket"
import { ipcRenderer } from "electron";
import { MESSAGES } from "../common/messages";

const STICK_DEADZONE = 0.5;
const BUTTON_A = 0;
const BUTTON_DPAD_LEFT = 14;
const BUTTON_DPAD_RIGHT = 15;

export default class RocketProjects extends React.Component {
	constructor(props) {
		super(props);

		/**
		 * @type {RocketProject[]}
		 */
		this.projects = props.Projects;
		this.state = { selectedIndex: 0 };

		this._rafId = null;
		this._navHeld = false;
		this._launchHeld = false;
		this._pollGamepads = this._pollGamepads.bind(this);
	}

	componentDidMount() {
		this._rafId = requestAnimationFrame(this._pollGamepads);
	}

	componentWillUnmount() {
		if (this._rafId != null) {
			cancelAnimationFrame(this._rafId);
			this._rafId = null;
		}
	}

	_launchProject(project) {
		if (!document.hasFocus() || !project) {
			return;
		}
		ipcRenderer.send(MESSAGES.LAUNCH_ROCKET, project);
	}

	_moveSelection(delta) {
		const count = this.projects.length;
		if (count < 1) {
			return;
		}
		this.setState((state) => ({
			selectedIndex: (state.selectedIndex + delta + count) % count,
		}));
	}

	_selectWithMouse(index) {
		if (this.state.selectedIndex !== index) {
			this.setState({ selectedIndex: index });
		}
	}

	_readNavigationDirection(pad) {
		const dpadLeft = pad.buttons[BUTTON_DPAD_LEFT] && pad.buttons[BUTTON_DPAD_LEFT].pressed;
		const dpadRight = pad.buttons[BUTTON_DPAD_RIGHT] && pad.buttons[BUTTON_DPAD_RIGHT].pressed;
		const stickX = pad.axes[0] || 0;

		if (dpadLeft || stickX < -STICK_DEADZONE) {
			return -1;
		}
		if (dpadRight || stickX > STICK_DEADZONE) {
			return 1;
		}
		return 0;
	}

	_pollGamepads() {
		const pads = navigator.getGamepads ? navigator.getGamepads() : [];
		let navDirection = 0;
		let launchPressed = false;

		for (let i = 0; i < pads.length; i++) {
			const pad = pads[i];
			if (!pad) {
				continue;
			}

			const direction = this._readNavigationDirection(pad);
			if (direction !== 0) {
				navDirection = direction;
			}

			if (pad.buttons[BUTTON_A] && pad.buttons[BUTTON_A].pressed) {
				launchPressed = true;
			}
		}

		if (navDirection !== 0) {
			if (!this._navHeld) {
				this._moveSelection(navDirection);
				this._navHeld = true;
			}
		} else {
			this._navHeld = false;
		}

		if (launchPressed) {
			if (!this._launchHeld) {
				this._launchProject(this.projects[this.state.selectedIndex]);
				this._launchHeld = true;
			}
		} else {
			this._launchHeld = false;
		}

		this._rafId = requestAnimationFrame(this._pollGamepads);
	}

	render() {
		const numProjects = 1.0 / (Math.max(1, this.projects.length));
		const { selectedIndex } = this.state;

		const ProjectList = this.projects.map((project, index) => {
			const styles = {
				width: `${numProjects * 100}%`,
			};
			const media = project.isvideo ? (
				<div className="videocontainer">
					<div className="overlay"></div>
					<video playsInline={true} autoPlay={true} muted loop>
						<source src={project.banner} type="video/webm" />
					</video>
				</div>
			) : (
				<div className="imagecontainer" >
					<div className="overlay"></div>
					<img src={project.banner} alt="" />
				</div>
			);

			return (
				<li
					key={project.description}
					className={index === selectedIndex ? "selected" : undefined}
					onMouseMove={() => this._selectWithMouse(index)}
					onClick={() => this._launchProject(project)}
					style={styles}
				>
					{project.logo && (
						<div className="logocontainer">
							<img className="studio-logo" src={project.logo} alt="" />
						</div>
					)}
					{media}
					<p className="description">{project.description}</p>
				</li>
			);
		});

		return (<ul className="project-list">
			{ProjectList}
		</ul>);
	}
}
