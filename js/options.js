// Saves options to localStorage.
document.getElementById("form").onsubmit = function () {
    var key = document.getElementById("api_key").value;
    var url = document.getElementById("api_url").value;
    localStorage["api_key"] = key;
    localStorage["api_url"] = url;

    // Update status to let user know options were saved.
    var status = document.getElementById("status");
    status.innerHTML = "Options Saved.";
    setTimeout(function() {
        status.innerHTML = "";
    }, 3000);

    return false;
};

// Restores select box state to saved value from localStorage.
document.body.onload = function() {
    var key = localStorage["api_key"];
    if(key){
        document.getElementById("api_key").value = key;
    }

    var url = localStorage["api_url"];
    if(url){
        document.getElementById("api_url").value = url;
    }
}