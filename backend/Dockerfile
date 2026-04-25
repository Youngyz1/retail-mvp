FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["RetailOS.Api/RetailOS.Api.csproj", "RetailOS.Api/"]
RUN dotnet restore "RetailOS.Api/RetailOS.Api.csproj"
COPY . .
WORKDIR "/src/RetailOS.Api"
RUN dotnet build "RetailOS.Api.csproj" -c Release -o /app/build
RUN dotnet publish "RetailOS.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
ENTRYPOINT ["dotnet", "RetailOS.Api.dll"]

