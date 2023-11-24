//dev
// const server = "http://localhost:8080";
//prod
const server = "https://contaaberta.info";

async function setProjectsIds () {
    const projects_id = await chrome.storage.local.get("contaaberta_projects");

    const select = document.getElementById('projectid');

    projects_id.contaaberta_projects.forEach( (project_id) => {
        const option = document.createElement('option');
        option.value = project_id;
        option.text = project_id;
        select.appendChild(option);
    });
}

async function isLogin(){
    const cookie = await chrome.cookies.getAll({domain: domain});
    if(cookie.length === 0) {
        setIcon("icons/error-38.png");
        writeError(`Faça <a href=${server_login} target="_blank">Login</a> no conta aberta!`);
        return;
    }
}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
    const option = document.createElement('option');
    option.value = "";
    option.text = "Selecione um projeto";
    parent.appendChild(option);
}

async function updatelistprojects() {
    const cookie = await chrome.cookies.getAll({domain: domain});
    const loader = document.getElementById("loader");
    let path_error = "icons/error-38.png";

    loader.style.display = "inline-block";

    const response = await fetch( server + "/api/myprojects", {
        method: "GET",
        headers: {"Content-Type": "application/json",
                   "cookie": cookie}});

        projects = await response.json();

        switch (response.status){
            case 200: 
                loader.style.display = "none";
                const projects_id = projects.map( (project) => {
                const id = (Object.values(project)[0]);
                     return id;
                });
                const select = document.getElementById('projectid');
                removeAllChildNodes(select);
                projects_id.forEach( (project_id) => {
                    const option = document.createElement('option');
                    option.value = project_id;
                    option.text = project_id;
                    select.appendChild(option);
                });
                writeSuccess("Projetos Atualizados!");
                break;
            case 403:
                setIcon(path_error);
                loader.style.display = "none";
                writeError("Faça <a href=${server_login} target='_blank'>Login</a> no conta aberta!");
                break;
            default:
                setIcon(path_error);
                loader.style.display = "none";
                writeError("Erro ao enviar!"); 
                break;
            }}

isLogin();
setProjectsIds();

document.getElementById('update-projects').addEventListener('click', updatelistprojects);
