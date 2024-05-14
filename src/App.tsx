import React from 'react';
import GraphRenderer from './views/GraphRenderer';
import JSONdata from './views/JsonValidator';

const App = () => {
    return (
        <div>
            <GraphRenderer jsonData={JSONdata} />
        </div>
    );
}

export default App;
