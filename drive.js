// Google Drive access for Riyaz Room: sign-in, listing, download, upload, title reading, saved settings.
// Exposes window.RiyazDrive. Uses the OAuth redirect flow so it works when the app is installed to the iPhone Home Screen.
(function(){
  const CFG=window.RIYAZ_CONFIG||{};
  const SCOPES='https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata';
  const API='https://www.googleapis.com/drive/v3/';
  const UP='https://www.googleapis.com/upload/drive/v3/';
  const TK='riyaz.gtoken';
  const ls={get(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
  const appUrl=()=>location.origin+location.pathname;

  // Pick up the token Google hands back after sign-in (#access_token=…)
  (function captureToken(){
    if(!location.hash.includes('access_token='))return;
    const p=new URLSearchParams(location.hash.slice(1));
    const t=p.get('access_token'),exp=+p.get('expires_in')||3600;
    if(t)ls.set(TK,{t,exp:Date.now()+(exp-60)*1000});
    history.replaceState(null,'',appUrl());
  })();

  const token=()=>{const v=ls.get(TK);return v&&v.exp>Date.now()?v.t:null};
  const configured=()=>!!CFG.clientId&&!/YOUR_CLIENT_ID/.test(CFG.clientId);
  function signIn(){
    if(!configured())return;
    const u=new URL('https://accounts.google.com/o/oauth2/v2/auth');
    u.search=new URLSearchParams({client_id:CFG.clientId,redirect_uri:appUrl(),response_type:'token',scope:SCOPES,include_granted_scopes:'true'}).toString();
    location.href=u.toString();
  }
  function signOut(){const t=ls.get(TK);ls.del(TK);if(t&&t.t)fetch('https://oauth2.googleapis.com/revoke?token='+encodeURIComponent(t.t),{method:'POST'}).catch(()=>{})}

  async function api(url,opts={}){
    const t=token();if(!t)throw{code:'needs_reauth',message:'Sign in to Google Drive again.'};
    let r;try{r=await fetch(url.startsWith('http')?url:API+url,{...opts,headers:{Authorization:'Bearer '+t,...(opts.headers||{})}})}
    catch(e){throw{code:'server_unavailable',message:'No connection to Google Drive.'}}
    if(r.status===401){ls.del(TK);throw{code:'needs_reauth',message:'Sign in to Google Drive again.'}}
    if(!r.ok){let m='';try{m=(await r.json()).error.message}catch(e){}throw{code:'tool_error',status:r.status,message:m||('Google Drive error '+r.status)}}
    return r;
  }
  const q=s=>encodeURIComponent(s);

  let folderId=ls.get('riyaz.folderId');
  async function folder(){
    if(folderId)return folderId;
    const name=(CFG.folderName||'Piano').replace(/'/g,"\\'");
    const r=await (await api(`files?q=${q(`name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`)}&fields=files(id,name)&pageSize=10&orderBy=createdTime`)).json();
    if(r.files&&r.files.length)folderId=r.files[0].id;
    else{const c=await (await api('files?fields=id',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:CFG.folderName||'Piano',mimeType:'application/vnd.google-apps.folder'})})).json();folderId=c.id}
    ls.set('riyaz.folderId',folderId);return folderId;
  }

  async function list(){
    const id=await folder();let files=[],page='';
    for(let i=0;i<20;i++){
      const r=await (await api(`files?q=${q(`'${id}' in parents and trashed=false`)}&fields=nextPageToken,files(id,name,mimeType,size,createdTime,webViewLink)&pageSize=1000${page?'&pageToken='+q(page):''}`)).json();
      files=files.concat((r.files||[]).map(f=>({id:f.id,title:f.name,mimeType:f.mimeType,fileSize:f.size||'0',createdTime:f.createdTime,viewUrl:f.webViewLink})));
      page=r.nextPageToken;if(!page)break;
    }
    return files;
  }
  async function blob(id){return (await api(`files/${id}?alt=media`)).blob()}
  async function upload(name,blob,mime,parent){
    const meta={name,parents:[parent||await folder()]};
    const fd=new FormData();fd.append('metadata',new Blob([JSON.stringify(meta)],{type:'application/json'}));fd.append('file',new Blob([blob],{type:mime||blob.type||'application/octet-stream'}));
    return (await api(UP+'files?uploadType=multipart&fields=id',{method:'POST',body:fd})).json();
  }
  // Read the text printed on a note photo: Drive's own OCR runs when an image is copied as a Google Doc.
  async function readText(id){
    const c=await (await api(`files/${id}/copy?ocrLanguage=en&fields=id`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'riyaz-reading-title',mimeType:'application/vnd.google-apps.document'})})).json();
    try{return await (await api(`files/${c.id}/export?mimeType=text/plain`)).text()}
    finally{api(`files/${c.id}`,{method:'DELETE'}).catch(()=>{})}
  }

  // Saved choices (matches, names, practice notes) live in a private app-only file in your Drive.
  let stateId=null;
  async function loadState(){
    const r=await (await api(`files?spaces=appDataFolder&q=${q("name='riyaz-state.json'")}&fields=files(id)`)).json();
    if(!r.files||!r.files.length)return null;stateId=r.files[0].id;
    try{return await (await api(`files/${stateId}?alt=media`)).json()}catch(e){return null}
  }
  async function saveState(obj){
    const body=new Blob([JSON.stringify(obj)],{type:'application/json'});
    if(stateId){await api(UP+`files/${stateId}?uploadType=media`,{method:'PATCH',body});return}
    const r=await upload('riyaz-state.json',body,'application/json','appDataFolder');stateId=r.id;
  }

  window.RiyazDrive={configured,token,signIn,signOut,list,blob,upload,readText,loadState,saveState,folder};
})();
