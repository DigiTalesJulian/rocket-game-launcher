import React from "react"

import "common/rocket"
import { ipcRenderer } from "electron";
import { MESSAGES } from "../common/messages";

export default class RocketProjects extends React.Component {
	constructor(props) {
		super(props);

		/**
		 * @type {RocketProject[]}
		 */
		this.projects = props.Projects;
	}

	_onfocus(e) {
		// console.log(this);
		if (document.hasFocus()) {

			ipcRenderer.send(MESSAGES.LAUNCH_ROCKET, this);
		}
	}

	render() {

		const numProjects = 1.0 / (Math.max(1, this.projects.length));



		const ProjectList = this.projects.map((project) => {
			let styles = {
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
				<li key={project.description} onClick={this._onfocus.bind(project)} style={styles} >
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
