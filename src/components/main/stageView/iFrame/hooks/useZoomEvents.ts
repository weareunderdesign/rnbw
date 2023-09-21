export const useZoomEvents = (
	currentZoom: number,
	setCurrentZoom: React.Dispatch<React.SetStateAction<number>>
) => {
	  const zoomIn = (zoomSize: string) => {
		console.log(zoomSize, 'zoomSize');
		const IframeElement = document.getElementById('iframeId');
		if (IframeElement) {
		  IframeElement.style.transform = `scale(${zoomSize})`;
		}
	  };
	  
	  const zoomOut = (zoomSize: string) => {
		const IframeElement = document.getElementById('iframeId');
		if (IframeElement) {
		  
		  IframeElement.style.transform = `scale(${zoomSize})`;
		  IframeElement.style.transformOrigin = 'unset';
		  IframeElement.style.overflow = 'auto';
		  IframeElement.style.position = 'static';
		}
	  };
	
	  const handleKeyDown = (event:KeyboardEvent) => {
		console.log(event.key,'dskmjsfs')
		switch(event.key){
		  case '1':
			zoomIn("0.1");
			setCurrentZoom(10) 
			break;
		  case '2':
			zoomIn("0.2");
			setCurrentZoom(20) 
			break;
		  case '3':
			zoomIn("0.3");
			setCurrentZoom(30) 
			break;
		  case '4':
			zoomIn("0.4");
			setCurrentZoom(40) 
			break;
		  case '5':
			zoomIn("0.5");
			setCurrentZoom(50) 
			break;
		  case '6':
			zoomIn("0.6");
			setCurrentZoom(60) 
			break;
		  case '7':
			zoomIn("0.7");
			setCurrentZoom(70) 
			break;
		  case '8':
			zoomIn("0.8");
			setCurrentZoom(80) 
			break;  
		  case '9':
			zoomIn("0.9");
			setCurrentZoom(90) 
			break;
		  case 'Escape':
		  case '0':
			zoomOut("1");
			setCurrentZoom(100) 
			break;
			 
		  case '+':
			if (currentZoom < 100) {
			  const newZoom = currentZoom + 25;
			  setCurrentZoom(newZoom);
			  zoomIn(`${newZoom / 100}`);
			}
			break;
		  case '-':
			if (currentZoom > 25) {
			  const newZoom = currentZoom - 25;
			  setCurrentZoom(newZoom);
			  zoomOut(`${newZoom / 100}`);
			}
			break;
		  default:
			break; 
		}
	  };

	  return{ handleKeyDown }  
	  }