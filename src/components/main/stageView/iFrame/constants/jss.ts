const emptyImage = window.location.origin + "/images/empty-image.svg";
const emptyAudio = window.location.origin + "/images/empty-image.svg";
export const jss = `
(function() {
    // your page initialization code here
    // the DOM will be available here
    
    const imageValidate = function() {
       const imgs = document.getElementsByTagName('img');
       for (let i = 0 ; i < imgs.length ; i ++) {
        if (imgs[i].src === '' || imgs[i].src === null) {
            // imgs[i].src = '${emptyImage}'
        }
        else {
            // imgs[i].setAttribute('onerror', "this.onerror=null; this.src='${emptyImage}'")
        }
       }
    }
   //  const audioValidate = function() {
   //      const audios = document.getElementsByTagName('audio');
   //      for (let i = 0 ; i < audios.length ; i ++) {
   //       if (audios[i].src === '' || audios[i].src === null) {
   //          audios[i].src = '${emptyAudio}'
   //       }
   //       else {
   //          audios[i].setAttribute('onerror', "this.onerror=null; this.src='${emptyAudio}'")
   //       }
   //      }
   //   }
    // The page is fully loaded
    setInterval(() => imageValidate(), 100)
 
 })();

`;
