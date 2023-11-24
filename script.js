
const form = document.querySelector('form');
const allowed = /^https:\/\/internetpf[0-9]+\.itau\.com\.br/;
//dev
// const server_url = "http://localhost:8080/api/itau-bank-statement"
// const server_login = "http://localhost:8080/login"
// const domain = "localhost";
//prod
const server_url = "https://contaaberta.info/api/itau-bank-statement"
const server_login = "https://contaaberta.info/login"
const domain = "contaaberta.info";

const setIcon = (path) => {
    chrome.action.setIcon({  path: {
        "38": path
    }})
}

function writeError(string) {
    document.getElementById('feedback').innerHTML = `<div class='wrapper-error'>
                                                        <svg xmlns='http://www.w3.org/2000/svg' height='1em' viewBox='0 0 512 512'><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d='M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z'/></svg>
                                                        <span class='error'>${string}</span></div>`;
}

function writeSuccess(string) {
    document.getElementById('feedback').innerHTML = `<div class='wrapper-success'>
                                                    <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
                                                    <span class='success'>${string}</span>
                                                    </div>`;
}

function readStatementBank (project_id) {
    let content = "";
    let info = "";
    try{
        content = document.getElementById("corpoTabela-gridLancamentos-pessoa-fisica").innerHTML;
        info = document.getElementsByClassName("info-conta").item(0).innerHTML;
    } catch (error) {
    }
    
    chrome.runtime.sendMessage({ type: "pageContent", 
                                content, 
                                projectId: project_id, 
                                account: info.split("c/c:").pop()});
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const loader = document.getElementById("loader");
    loader.style.display = "inline-block";
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const cookie = await chrome.cookies.getAll({domain: domain});

    if(cookie.length === 0) {
        writeError(`Faça <a href=${server_login} target="_blank">Login</a> no conta aberta!`);
        loader.style.display = "none";
        return;
    }

    if(allowed.test (tab.url) === false) {
        writeError("Não é possível enviar essa página!");
        loader.style.display = "none";
        return; 
    }

    const project_id = document.getElementById('projectid').value;
    
    if(project_id === undefined || project_id === "") {
        writeError("Project ID não pode ser vazio");
        loader.style.display = "none";
        return;
    }
    
    await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: readStatementBank,
    args: [project_id]
    }).then(() => {
    });

    await chrome.runtime.onMessage.addListener(async (message) =>  { 
        let path_error = "icons/error-38.png";
    try {
        const response = await fetch(server_url, {
            method: "POST",
            headers: { "Content-Type": "application/json", 
                    "cookie": cookie},
            body: JSON.stringify(message)
        });
        switch (response.status) {
            case 400:
                setIcon(path_error);
                writeError("Não foi possivel enviar o extrato! Verifique se o extrato está correto.");
                loader.style.display = "none";
                break;
            case 200:
                setIcon("icons/active-38.png");
                await chrome.storage.local.set({"contaaberta_update": new Date().getTime()});
                writeSuccess("Extrato enviado com sucesso!");
                loader.style.display = "none";
                break;
            case 404:
                setIcon(path_error);
                writeError(`Projeto não encontrado, verifique se <b>${project_id}</b> é realmete o id do projeto.`);
                loader.style.display = "none";
                break;
            case 401:
                setIcon(path_error);
                writeError(`Faça <a href=${server_login} target='_blank'>Login</a> no conta aberta!`);
                loader.style.display = "none";
                break;
            case 409:
                setIcon(path_error);
                writeError (`Esta conta não está vinculada a esse projeto de id <b>${project_id}</b>`)
                loader.style.display = "none";
                break
            default: 
                setIcon(path_error);
                writeError("Erro ao enviar!");
                loader.style.display = "none";
                break;
        }
      } catch (error) {
        setIcon(path_error);
      }
    });

})


