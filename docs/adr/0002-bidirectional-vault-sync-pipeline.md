# Sincronización Bidireccional y Pipeline de Indexación

Decidimos estructurar la persistencia mediante un pipeline de indexación automática (parser de Markdown con soporte de frontmatter y wikilinks `[[...]]`, SQLite para el grafo de relaciones y Vector Store local para búsqueda semántica/RAG). 

La sincronización es bidireccional: la Web App lee el vault maestro aplicando reglas de visibilidad (filtrando bloques y notas privadas de DM), y los eventos de campaña, decisiones y crónicas validadas por IA se guardan de vuelta como notas Markdown en carpetas designadas del vault.
