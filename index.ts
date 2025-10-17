type BuilderVeiculo = {
  modelo(modelo: string): BuilderVeiculo;
  cor(cor: string): BuilderVeiculo;
  portas(portas: number): BuilderVeiculo;
  ano(ano: number): BuilderVeiculo;
  build(): Veiculo;
};

const logger = (msg: string) => console.log(`[LOG] ${msg}`);

const METRO = 1;
const KM = 1000 * METRO; // 1000 m
const HORA = 3600; // s
const MS = 1000; // ms -> s

const KMH_TO_MS = (kmh: number) => (kmh * KM) / HORA; // km/h -> m/s
const MS_TO_KMH = (ms: number) => (ms * HORA) / KM; // m/s -> km/h

class Veiculo {
  protected modelo?: string;
  protected cor?: string;
  protected portas?: number;
  protected ano?: number;

  getModelo() {
    return this.modelo;
  }

  static builder<T extends Veiculo>(this: new () => T) {
    const that = new this(); // <- instancia a classe concreta
    return {
      modelo(modelo: string): BuilderVeiculo {
        that.modelo = modelo;
        return this;
      },
      cor(cor: string): BuilderVeiculo {
        that.cor = cor;
        return this;
      },
      portas(portas: number): BuilderVeiculo {
        that.portas = portas;
        return this;
      },
      ano(ano: number): BuilderVeiculo {
        that.ano = ano;
        return this;
      },
      build(): T {
        return that;
      }, // <- retorna T (Carro, Moto, etc.)
    };
  }
}

class Carro extends Veiculo {}
class Moto extends Veiculo {}

class Servidor {
  notificarExcessoVelocidade(veiculo: Veiculo, velocidade: number) {
    logger(
      `Veículo ${veiculo.getModelo()} excedeu a velocidade: ${velocidade}`
    );
  }
}

class Radar {
  protected limiteMs: number; // limite em m/s
  protected deltaMs = KMH_TO_MS(7); // 7 km/h de tolerância, em m/s
  protected distanciaSensores = 2 * METRO;
  protected servidor: Servidor;

  constructor(limiteKmh: number, servidor: Servidor) {
    this.limiteMs = KMH_TO_MS(limiteKmh);
    this.servidor = servidor;
  }

  mostraLimiteKmh() {
    return MS_TO_KMH(this.limiteMs);
  }

  limiteComDelta() {
    return this.limiteMs + this.deltaMs;
  }

  iniciaSensor(veiculo: Veiculo) {
    const startTime = new Date();
    logger(
      `Sensor iniciado para o veículo ${veiculo.getModelo()} às ${startTime.toISOString()}`
    );
    return () => this.calculoFinal(startTime.getTime(), veiculo);
  }

  calculoFinal(tempoInicialMs: number, veiculo: Veiculo) {
    const tempoDecorridoMs = Date.now() - tempoInicialMs;
    if (tempoDecorridoMs <= 0) return; // evita div/0 e leituras ruins
    logger(
      `Sensor finalizado para o veículo ${veiculo.getModelo()} com tempo decorrido de ${tempoDecorridoMs} ms`
    );

    const tempoS = tempoDecorridoMs / MS;
    const velocidadeMs = this.distanciaSensores / tempoS; // m/s

    logger(`Velocidade medida: ${MS_TO_KMH(velocidadeMs)} km/h`);

    if (velocidadeMs > this.limiteComDelta()) {
      this.servidor.notificarExcessoVelocidade(
        veiculo,
        MS_TO_KMH(velocidadeMs)
      ); // reporte em km/h
    }
  }
}

const carro = Carro.builder()
  .modelo("Uno")
  .cor("Branco")
  .portas(4)
  .ano(2020)
  .build();

const pardal = new Radar(70, new Servidor());

logger(`Limite do radar: ${pardal.mostraLimiteKmh()} km/h`);
logger("----");

const sensorCarro = pardal.iniciaSensor(carro);
setTimeout(() => {
  sensorCarro();

  logger("----");

  const moto = Moto.builder().modelo("Ninja").cor("Verde").ano(2021).build();

  const sensorMoto = pardal.iniciaSensor(moto);
  setTimeout(() => {
    sensorMoto();
  }, 70);
}, 60);
