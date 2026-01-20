# 📦AWS S3 Object Replication Pipeline (Event-Driven)

Este repositório contém o código-fonte de uma aplicação backend responsável por replicar objetos entre buckets do Amazon S3, construída com foco em arquitetura orientada a eventos, processamento assíncrono, retry com backoff e reprocessamento controlado.

O sistema utiliza o Amazon S3 como fonte de verdade dos arquivos e reage a eventos de criação de objetos, evitando acoplamento direto entre upload, processamento e replicação.

O objetivo é garantir consistência entre buckets, permitir retry controlado, DLQ, e reprocessamento assíncrono de objetos que falharam ou não foram replicados automaticamente.

## O fluxo principal do sistema é event-driven:

1. Um objeto é enviado para o bucket principal no Amazon S3.
2. O S3 emite um evento de ObjectCreated (PutObject).
4. O Amazon EventBridge captura esse evento.
5. O EventBridge encaminha apenas os metadados do objeto para o backend.
6. O backend registra o evento e dispara o processo de replicação de forma assíncrona.
7. Workers consomem a fila, fazem o download via stream e realizam o upload para os buckets de backup.
8. Falhas entram em fluxos de retry com backoff exponencial e, se necessário, DLQ.
9. O backend nunca recebe o arquivo diretamente, apenas reage aos eventos emitidos pelo S3, garantindo escalabilidade, isolamento de responsabilidades e resiliência a falhas.

## 🚀 Funcionalidades

 - [x] Replicação de objetos S3 para múltiplos buckets de backup.
 - [x] Orquestração baseada em eventos usando Amazon EventBridge.
 - [x] Processamento assíncrono com filas e consumers em Node.js.
 - [x] Retry com backoff exponencial para falhas temporárias.
 - [x] Dead Letter Queue (DLQ) para mensagens que excedem o limite de tentativas.
 - [x] Persistência de estado para auditoria e rastreabilidade.
 - [x] Arquitetura preparada para alto volume de uploads simultâneos.
 - [ ] Serviço de seleção dinâmica do bucket com menor latência.
 - [ ] Estratégia de cache para reduzir consultas ao banco de dados.
 - [ ] Rotina para reprocessamento em batch de replicações que falharam utilizando EC2 Spot Instances.

## 🧩 Componentes da Aplicação

 | Componente                | Responsabilidade Principal                                      | Observações Arquiteturais                                                         |
|---------------------------|------------------------------------------------------------------|------------------------------------------------------------------------------------|
| **Amazon S3**             | Bucket de origem e buckets de backup                             | Versionamento habilitado; atua como fonte de verdade dos objetos                   |
| **Amazon EventBridge**    | Orquestração e roteamento de eventos                             | Encaminha apenas metadados, reduzindo tráfego e acoplamento                        |
| **Backend Node.js**       | Orquestra o fluxo de replicação                                  | Arquitetura reativa, orientada a eventos                                           |
| **RabbitMQ / SQS**        | Filas de processamento, retry e backoff                          | Absorve picos de carga e garante reprocessamento controlado                        |
| **Consumers Node.js**     | Download e upload de objetos                                     | Não possuem lógica de negócio                                                      |
| **Redis**                 | Cache de estado e métricas                                       | Reduz queries repetitivas no banco; TTL configurável                               |
| **Latency Selector Service** | Seleção dinâmica do bucket com menor latência                  | Baseado em métricas reais (HEAD / GET parcial)                                     |
| **DLQ**                   | Mensagens que falharam definitivamente                           | Permite auditoria e reprocessamento batch                                          |
| **EC2 Spot Instance**     | Reprocessamento batch em horários específicos                    | Infraestrutura efêmera para otimização de custos                                   |
| **PostgreSQL**            | Persistência definitiva do estado de replicação                  | Consistência, auditoria e histórico                                                |


