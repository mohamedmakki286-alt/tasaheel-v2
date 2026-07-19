@REM ----------------------------------------------------------------------------
@REM Maven Wrapper - runs Maven via the downloaded distribution
@REM ----------------------------------------------------------------------------
@if "%JAVA_HOME%"=="" set "JAVA_HOME=C:\Program Files\Amazon Corretto\jdk17.0.19_10"
@setlocal
@REM Use the full Maven distribution directly
@set "MAVEN_HOME=C:\Users\pc\.m2\wrapper\dists\apache-maven-3.9.6"
@"%MAVEN_HOME%\bin\mvn.cmd" %*
