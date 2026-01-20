# Conceitos revisados/estudados neste projeto

- [ ] Conceitos do RabbitMQ;
  - [ ] Como funcionam as exchanges;
  - [ ] Como funciona o método "prefetch()";
- [ ] Como escalonar o número de consumers com PM2;
- [ ] Consumers de filas não devem executar responsabilidades de use cases ou serviços de negócio;
- [ ] Como funciona o PassThrough Stream;
- [ ] Como reprocessar uploads que falharam para alguns buckets (implementação de retry com backoff exponencial);
  - [ ] DLQ (Dead Letter Queue) no RabbitMQ;
  - [ ] DLX (Dead Letter Exchange) e seus headers;
- [ ] Como funcionam os volumes no docker-compose e por que são necessários;
- [ ] Estratégia de cache (Redis) para melhorar a performance da aplicação;
- [ ] Consistência Eventual;
