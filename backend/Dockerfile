# -- Build stage --
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests -B

# -- Runtime stage --
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN groupadd -r tasaheel && useradd -r -g tasaheel tasaheel

COPY --from=build /app/target/*.jar app.jar

RUN mkdir -p /tmp/tasaheel/uploads && chown -R tasaheel:tasaheel /tmp/tasaheel

USER tasaheel

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
