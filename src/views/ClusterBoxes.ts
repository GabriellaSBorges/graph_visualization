

export function setupClusterCheckboxes(clusterInputParent: HTMLElement, clustercounter: number, setClusters: Function, getSelectedClusters: Function, toggleShowAllNodes: Function, handleClusterChange: Function): void {
    // Verificar se o seletor já existe antes de criar novamente
    if (clusterInputParent && !clusterInputParent.querySelector("#clusterCheckboxes")) {
        // Cria um grupo de checkboxes
        const clusterCheckboxesGroup = document.createElement("div");
        clusterCheckboxesGroup.id = "clusterCheckboxes";
        
        // Adiciona a opção "Exibir Todos" como checkbox
        const showAllCheckbox = document.createElement("input");
        showAllCheckbox.type = "checkbox";
        showAllCheckbox.name = "clusterOption";
        showAllCheckbox.value = "";
        showAllCheckbox.id = "showAllCheckbox";
        showAllCheckbox.addEventListener("change", () => toggleShowAllNodes(
            showAllCheckbox.checked,
            setClusters,
            getSelectedClusters,
        )); // Define a função de clique para exibir todos
        const showAllLabel = document.createElement("label");
        showAllLabel.htmlFor = "showAllCheckbox";
        showAllLabel.textContent = "Exibir Todos";
        clusterCheckboxesGroup.appendChild(showAllCheckbox);
        clusterCheckboxesGroup.appendChild(showAllLabel);

        // Adiciona as checkboxes para cada cluster
        for (let i = 0; i < clustercounter; i++) {
            const clusterCheckbox = document.createElement("input");
            clusterCheckbox.type = "checkbox";
            clusterCheckbox.name = "clusterOption";
            clusterCheckbox.value = i.toString();
            clusterCheckbox.id = `clusterCheckbox${i}`;
            clusterCheckbox.addEventListener("change", handleClusterChange(setClusters, getSelectedClusters)); // Define a função de clique para selecionar o cluster
            const clusterLabel = document.createElement("label");
            clusterLabel.htmlFor = `clusterCheckbox${i}`;
            clusterLabel.textContent = `Cluster ${i + 1}`;
            clusterCheckboxesGroup.appendChild(clusterCheckbox);
            clusterCheckboxesGroup.appendChild(clusterLabel);
        }
        
        clusterInputParent.appendChild(clusterCheckboxesGroup);
    }
}