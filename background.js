const allowed = /^https:\/\/internetpf[0-9]+\.itau\.com\.br/;
//dev
// const domain = "localhost";
// const server = "http://localhost:8080";
//prod
const domain = "contaaberta.info";
const server = "http://contaaberta.info";


chrome.tabs.onActivated.addListener(() => {

    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
        let path = allowed.test(tabs[0].url) 
            ? "/icons/active-38.png" : "icons/disabled-38.png";
        chrome.action.setIcon({  path: {
            "38": path
        } });

        chrome.storage.local.get("contaaberta_update").then((result) => {
            
            if (result.contaaberta_update === undefined) {
                return;
            }

            let oneDay = 24 * 60 * 60 * 1000; //millisecondsInOneDay
            let diffTime = new Date().getTime() - result.contaaberta_update;
            
            if (diffTime > oneDay) {
             chrome.action.setIcon({  path: {
                "38": "icons/warning-38.png"
             }});
            }    
          });

          const cookie = await chrome.cookies.getAll({domain: domain});
          let projects = await chrome.storage.local.get("contaaberta_projects");

          if(projects.contaaberta_projects && cookie.length === 0) {
            chrome.storage.local.remove("contaaberta_projects");
            return;
          }

          const response = await fetch( server + "/api/myprojects", {
            method: "GET",
            headers: {"Content-Type": "application/json",
                       "cookie": cookie}});

            projects = await response.json();
            const projects_id = projects.map( (project) => {
                const id = (Object.values(project)[0]);
                return id;
            });
            await chrome.storage.local.set({contaaberta_projects: projects_id});
            
          })

    });


chrome.webNavigation.onCompleted.addListener( () => {
    chrome.tabs.query ({active: true, currentWindow: true}, function (tabs) {
        if ( tabs[0] === undefined) {
            return;
        }
        let path = allowed.test(tabs[0].url) 
            ? "/icons/active-38.png" : "icons/disabled-38.png";
        chrome.action.setIcon({  path: {
            "38": path
        } })
    })})

